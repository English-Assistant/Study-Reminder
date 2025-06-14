import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { MailService } from '../../mail/mail.service';
import { StudyRecord } from '@prisma/client';
import dayjs from 'dayjs';
import { ReviewItem } from '../types/review-item.type';

export interface ReviewReminderDetails {
  itemName: string; // 例如 StudyRecord.textTitle
  courseName: string; // 课程名称
  time?: string; // HH:mm，可选
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
  ) {}

  private constructBaseTime(studyRecord: StudyRecord): dayjs.Dayjs {
    return dayjs(studyRecord.studiedAt).second(0).millisecond(0);
  }

  // 旧的每分钟扫描已被 BullMQ 替代，如需回滚可重新启用
  /*
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

          const adjustedTime = this.adjustNotificationTimeForWindows(
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
              time: adjustedTime.format('HH:mm'),
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
  */

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

  /**
   * 提供给 BullMQ Processor 的简化接口，根据用户与记录 ID 直接发送提醒。
   */
  async sendReminderByIds(
    userId: string,
    studyRecordId: string,
    ruleId: number,
    itemName: string,
    courseName: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user || !user.settings || !user.settings.globalNotification) {
      return;
    }

    const reviewDetails: ReviewReminderDetails = { itemName, courseName };

    if (user.settings.emailNotification && user.email) {
      await this.sendReviewReminderEmail(
        user.email,
        user.username,
        reviewDetails,
      );
    }

    if (user.settings.inAppNotification) {
      this.sendInAppNotification(user.id, {
        title: `复习提醒: ${reviewDetails.itemName} - ${reviewDetails.courseName}`,
        body: `现在是计划的复习时间，请完成复习。`,
        tag: reviewDetails.itemName,
      });
    }
    this.logger.log(
      `完成用户 ${userId} 的提醒发送 (记录: ${studyRecordId}, 规则: ${ruleId})`,
    );
  }

  /**
   * 根据 5 分钟窗口批量发送提醒。
   * @param userId 目标用户
   * @param items 同一窗口内需要提醒的复习项集合
   * 业务规则：
   *   1. items.length === 1 → 走原有单条提醒逻辑（保证邮件模板一致）。
   *   2. items.length >= 2 → 走批量邮件&合并应用内通知。
   */
  async sendBulkReminder(userId: string, items: ReviewItem[]) {
    if (items.length === 0) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user || !user.settings || !user.settings.globalNotification) {
      return;
    }

    // ---------- 邮件提醒 ----------
    if (user.settings.emailNotification && user.email) {
      // 单条退化：沿用原模板
      if (items.length === 1) {
        const [it] = items;
        await this.sendReviewReminderEmail(user.email, user.username, {
          itemName: it.itemName,
          courseName: it.courseName,
          time: it.time,
        });
      } else {
        await this.mailService.sendBulkReviewReminderEmail(
          user.email,
          user.username,
          items.map((it: ReviewItem) => ({
            itemName: it.itemName,
            courseName: it.courseName,
            time: it.time,
          })),
        );
      }
    }

    // ---------- 应用内通知 (WebSocket) ----------
    if (user.settings.inAppNotification) {
      if (items.length === 1) {
        const [it] = items;
        this.sendInAppNotification(user.id, {
          title: `复习提醒: ${it.itemName} - ${it.courseName}`,
          body: `计划时间 ${it.time}，请完成复习。`,
          tag: it.itemName,
        });
      } else {
        this.sendInAppNotification(user.id, {
          title: `您有 ${items.length} 个待复习任务`,
          body: items
            .slice(0, 3)
            .map(
              (it: ReviewItem) =>
                `${it.itemName} - ${it.courseName} (${it.time})`,
            )
            .join('；'),
          tag: 'bulk-review',
        });
      }
    }
  }
}
