import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { MailService } from '../../mail/mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  User,
  Setting,
  StudyRecord,
  ReviewRule,
  StudyTimeWindow,
} from '@prisma/client';
import dayjs from 'dayjs';
import { ReviewLogicService } from '../../review-logic/review-logic.service';

// 辅助类型，用于组合用户及其相关数据
type UserWithRelations = User & {
  settings: Setting | null;
  reviewRules: ReviewRule[];
  studyRecords: (StudyRecord & {
    course: {
      id: string;
      name: string;
    } | null;
  })[];
  studyTimeWindows: StudyTimeWindow[]; // 用户的学习时间段
};

export interface ReviewReminderDetails {
  itemName: string; // 例如 StudyRecord.textTitle
  courseName: string; // 课程名称
}

/**
 * 负责处理和发送所有类型的通知，包括邮件和应用内 WebSocket 推送。
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly mailService: MailService,
    private readonly reviewLogicService: ReviewLogicService,
  ) {}

  private constructBaseTime(studyRecord: StudyRecord): dayjs.Dayjs {
    return dayjs(studyRecord.studiedAt).second(0).millisecond(0);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledReviewChecks() {
    this.logger.log('运行计划中的复习项检查...');
    const now = dayjs().second(0).millisecond(0);

    const users = (await this.prisma.user.findMany({
      where: {
        settings: {
          globalNotification: true,
          OR: [{ emailNotification: true }, { inAppNotification: true }],
        },
      },
      include: {
        settings: true,
        reviewRules: true,
        studyTimeWindows: true,
        studyRecords: {
          include: {
            course: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })) as UserWithRelations[];

    if (!users || users.length === 0) {
      this.logger.log('没有找到需要处理通知的用户。');
      return;
    }

    for (const user of users) {
      if (
        !user.settings ||
        (!user.settings.emailNotification && !user.settings.inAppNotification)
      ) {
        continue;
      }
      if (
        !user.reviewRules ||
        user.reviewRules.length === 0 ||
        !user.studyRecords ||
        user.studyRecords.length === 0
      ) {
        continue;
      }

      this.logger.log(`处理用户 ${user.id} (${user.username}) 的通知。`);

      for (const record of user.studyRecords) {
        const baseTime = this.constructBaseTime(record);
        if (!baseTime.isValid()) {
          this.logger.warn(
            `无效的基础时间，记录ID: ${record.id}。打卡日期: ${record.studiedAt ? record.studiedAt.toISOString() : '无'}。`,
          );
          continue;
        }

        for (const rule of user.reviewRules) {
          let expectedReviewAtDayjs =
            this.reviewLogicService.calculateNextReviewTime(
              record.studiedAt,
              rule,
            );

          // 如果是循环规则，并且计算出的时间在当前时间之前，
          // 则需要找到未来的第一个有效复习时间
          if (
            rule.mode === 'RECURRING' &&
            expectedReviewAtDayjs.isBefore(now)
          ) {
            const ruleInterval = dayjs.duration(
              rule.value,
              rule.unit.toLowerCase() as dayjs.ManipulateType,
            );
            const timeDiff = now.diff(expectedReviewAtDayjs);
            // 向上取整，确保我们找到的是下一个或当前的周期
            const intervalsToSkip = Math.ceil(
              timeDiff / ruleInterval.asMilliseconds(),
            );
            expectedReviewAtDayjs = expectedReviewAtDayjs.add(
              intervalsToSkip * ruleInterval.asMilliseconds(),
              'millisecond',
            );
          }

          const adjustedTime =
            this.reviewLogicService.adjustReviewTimeForStudyWindows(
              expectedReviewAtDayjs,
              user.studyTimeWindows,
            );

          // 只有当调整后的时间与当前时间在同一分钟时，才发送通知
          if (adjustedTime.isSame(now, 'minute')) {
            this.logger.log(
              `为用户 ${user.id} 的学习记录 "${record.textTitle}" (ID: ${record.id}) 基于规则 (ID: ${rule.id}) 发现了匹配的提醒时间: ${adjustedTime.toISOString()}`,
            );

            const reviewDetails: ReviewReminderDetails = {
              itemName: record.textTitle,
              courseName: record.course?.name || '未知课程',
            };

            if (user.settings.emailNotification && user.email) {
              try {
                await this.sendReviewReminderEmail(
                  user.email,
                  user.username,
                  reviewDetails,
                );
              } catch (error) {
                this.logger.error(
                  `向用户 ${user.id} (${user.email}) 发送邮件提醒失败 (记录: ${record.id}, 规则: ${rule.id}):`,
                  error,
                );
              }
            }

            if (user.settings.inAppNotification) {
              try {
                this.sendInAppNotification(user.id, {
                  title: `复习提醒: ${reviewDetails.itemName} - ${reviewDetails.courseName}`,
                  body: `现在是计划的复习时间，请完成复习。`,
                  tag: reviewDetails.itemName,
                });

                this.logger.log(
                  `已向用户 ${user.id} 发送应用内提醒 (记录: ${record.id}, 规则: ${rule.id})`,
                );
              } catch (error) {
                this.logger.error(
                  `向用户 ${user.id} 发送应用内提醒失败 (记录: ${record.id}, 规则: ${rule.id}):`,
                  error,
                );
              }
            }
          }
        }
      }
    }
    this.logger.log('完成计划中的复习项检查。');
  }

  /**
   * 发送复习提醒邮件。
   * @param email - 接收者的邮箱地址。
   * @param username - 接收者的用户名。
   * @param reviewDetails - 复习项的详细信息。
   */
  async sendReviewReminderEmail(
    email: string,
    username: string,
    reviewDetails: ReviewReminderDetails,
  ): Promise<void> {
    this.logger.log(
      `准备发送邮件提醒给 ${email} (用户: ${username}), 项目: ${reviewDetails.itemName}, 课程: ${reviewDetails.courseName}`,
    );

    try {
      await this.mailService.sendReviewReminderEmail(
        email,
        username,
        reviewDetails.itemName,
        reviewDetails.courseName,
      );

      this.logger.log(
        `已成功发送复习提醒邮件给 ${email} (用户: ${username}), 项目: ${reviewDetails.itemName}`,
      );
    } catch (error) {
      this.logger.error(`发送邮件失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 通过 WebSocket 发送应用内实时通知。
   * @param userId - 目标用户的 ID。
   * @param data - 通知的数据负载，包括标题、正文和标签。
   */
  sendInAppNotification(
    userId: string,
    data: {
      title: string;
      body: string;
      tag: string;
    },
  ): void {
    this.logger.log(`发送应用内通知给用户 ${userId}, 标题: ${data.title}`);

    try {
      const notificationPayload = {
        title: data.title,
        body: data.body,
        tag: data.tag,
        timestamp: new Date().toISOString(),
      };

      // 通过 WebSocket 网关发送实时通知
      this.notificationsGateway.sendToUser(
        userId,
        'notification',
        notificationPayload,
      );

      this.logger.log(`已成功发送应用内通知给用户 ${userId}`);
    } catch (error) {
      this.logger.error(
        `发送应用内通知失败 (用户: ${userId}): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
