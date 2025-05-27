import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface ReviewReminderDetails {
  itemName: string;
}

const MIN_NOTIFICATION_INTERVAL_HOURS = 6; // 最小通知间隔（小时）
const PAST_WINDOW_MINUTES = 10; // 检查过去多少分钟内的项目
const FUTURE_WINDOW_MINUTES = 30; // 检查未来多少分钟内的项目

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name); // 添加日志记录器实例

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE) // 更新：每分钟运行一次
  async handleScheduledReviewChecks() {
    this.logger.log('运行计划中的复习项检查...');
    const now = new Date();
    const pastThreshold = new Date(
      now.getTime() - PAST_WINDOW_MINUTES * 60 * 1000,
    );
    const futureThreshold = new Date(
      now.getTime() + FUTURE_WINDOW_MINUTES * 60 * 1000,
    );
    const minIntervalThreshold = new Date(
      now.getTime() - MIN_NOTIFICATION_INTERVAL_HOURS * 60 * 60 * 1000,
    );

    const users = await this.prisma.user.findMany({
      where: {
        globalNotificationsEnabled: true,
        OR: [
          { emailNotificationsEnabled: true, email: { not: null } },
          { appNotificationsEnabled: true },
        ],
      },
      include: {
        manualReviewEntries: {
          where: {
            reviewDate: {
              gte: pastThreshold, // 大于等于 (现在 - 10 分钟)
              lte: futureThreshold, // 小于等于 (现在 + 30 分钟)
            },
            OR: [
              // lastNotifiedAt 的条件
              { lastNotifiedAt: null }, // 从未通知过
              { lastNotifiedAt: { lt: minIntervalThreshold } }, // 或上次通知在最小间隔之前 (例如6小时前)
            ],
          },
          include: {
            course: true,
          },
          orderBy: {
            reviewDate: 'asc',
          },
        },
      },
    });

    for (const user of users) {
      if (!user.manualReviewEntries || user.manualReviewEntries.length === 0) {
        continue;
      }

      this.logger.log(
        `处理用户 ${user.id} (${user.username}) 的 ${user.manualReviewEntries.length} 个复习项。`,
      );

      for (const entry of user.manualReviewEntries) {
        const reviewDetails: ReviewReminderDetails = {
          itemName: entry.title,
        };

        let notifiedByEmail = false;
        let notifiedByApp = false;

        if (user.emailNotificationsEnabled && user.email) {
          try {
            await this.sendReviewReminderEmail(
              user.email,
              user.username,
              reviewDetails,
            );
            notifiedByEmail = true;
          } catch (error) {
            this.logger.error(
              `向用户 ${user.id} 发送邮件提醒失败 (条目: ${entry.id}):`,
              error,
            );
          }
        }

        if (user.appNotificationsEnabled) {
          try {
            this.notificationsGateway.sendToUser(user.id, 'reviewReminder', {
              ...reviewDetails,
              entryId: entry.id,
            });
            notifiedByApp = true;
          } catch (error) {
            this.logger.error(
              `向用户 ${user.id} 发送应用内提醒失败 (条目: ${entry.id}):`,
              error,
            );
          }
        }

        if (notifiedByEmail || notifiedByApp) {
          this.logger.log(
            `已为用户 ${user.id} 的条目 ${entry.id} ('${entry.title}') 发送通知 (邮件: ${notifiedByEmail}, 应用内: ${notifiedByApp})。正在更新 lastNotifiedAt。`,
          );
          try {
            await this.prisma.manualReviewEntry.update({
              where: { id: entry.id },
              data: { lastNotifiedAt: new Date() },
            });
          } catch (error) {
            this.logger.error(
              `更新条目 ${entry.id} 的 lastNotifiedAt 失败:`,
              error,
            );
          }
        }
      }
    }
    this.logger.log('完成计划中的复习项检查。');
  }

  async sendReviewReminderEmail(
    email: string,
    username: string,
    reviewDetails: ReviewReminderDetails,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: `复习提醒: ${reviewDetails.itemName}`,
      template: join('review-reminder'),
      context: {
        itemName: reviewDetails.itemName,
        userName: username,
      },
    });
    this.logger.log(
      `已成功发送复习提醒邮件给 ${email} (用户: ${username})，项目: ${reviewDetails.itemName}`,
    );
  }

  // 此处未来可以添加发送应用内通知的方法
  // async sendInAppNotification(userId: string, message: any) { ... }
}
