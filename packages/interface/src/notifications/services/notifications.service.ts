import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  User,
  Setting,
  StudyRecord,
  ReviewRule,
  IntervalUnit,
  ReviewMode,
} from '@prisma/client';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

// 辅助类型，用于组合用户及其相关数据
type UserWithRelations = User & {
  settings: Setting | null;
  reviewRules: ReviewRule[];
  studyRecords: StudyRecord[];
};

export interface ReviewReminderDetails {
  itemName: string; // 例如 StudyRecord.textTitle
  // 可以根据需要添加更多字段，如 courseName, studyDate 等
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private constructBaseTime(studyRecord: StudyRecord): dayjs.Dayjs {
    // studyRecord.studiedAt is a Date object from Prisma, assumed to be UTC.
    // We directly use it and standardize seconds and milliseconds.
    return dayjs(studyRecord.studiedAt).utc().second(0).millisecond(0);
  }

  private addInterval(
    date: dayjs.Dayjs,
    value: number,
    unit: IntervalUnit,
  ): dayjs.Dayjs {
    let dayjsUnit: dayjs.ManipulateType;
    switch (unit) {
      case IntervalUnit.MINUTE:
        dayjsUnit = 'minute';
        break;
      case IntervalUnit.HOUR:
        dayjsUnit = 'hour';
        break;
      case IntervalUnit.DAY:
        dayjsUnit = 'day';
        break;
      default:
        this.logger.warn(`Unsupported IntervalUnit: ${String(unit)}`);
        return date; // Return original date if unit is unsupported
    }
    return date.add(value, dayjsUnit);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledReviewChecks() {
    this.logger.log('运行计划中的复习项检查 (使用 dayjs)...');
    const now = dayjs.utc().second(0).millisecond(0); // 当前 UTC 时间，标准化到分钟

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
        studyRecords: {
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
            `无效的基础时间 for record ${record.id}. 打卡日期: ${record.studiedAt ? record.studiedAt.toISOString() : 'N/A'}.`,
          );
          continue;
        }

        for (const rule of user.reviewRules) {
          let expectedNotificationTime: dayjs.Dayjs | null = null;

          if (rule.mode === ReviewMode.ONCE) {
            const potentialTime = this.addInterval(
              baseTime,
              rule.value,
              rule.unit,
            );
            if (potentialTime.isSame(now, 'minute')) {
              expectedNotificationTime = potentialTime;
            }
          } else if (rule.mode === ReviewMode.RECURRING) {
            let currentExpectedTime = this.addInterval(
              baseTime,
              rule.value,
              rule.unit,
            );

            if (currentExpectedTime.isAfter(now, 'minute')) {
              continue;
            }

            while (currentExpectedTime.isBefore(now, 'minute')) {
              currentExpectedTime = this.addInterval(
                currentExpectedTime,
                rule.value,
                rule.unit,
              );
            }

            if (currentExpectedTime.isSame(now, 'minute')) {
              expectedNotificationTime = currentExpectedTime;
            }
          }

          if (expectedNotificationTime) {
            this.logger.log(
              `为用户 ${user.id} 的学习记录 "${record.textTitle}" (ID: ${record.id}) 基于规则 (ID: ${rule.id}) 发现了匹配的提醒时间: ${expectedNotificationTime.toISOString()}`,
            );

            const reviewDetails: ReviewReminderDetails = {
              itemName: record.textTitle,
            };

            if (user.settings.emailNotification && user.email) {
              try {
                await this.sendReviewReminderEmail(
                  user.email,
                  user.username,
                  reviewDetails,
                  rule,
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
                this.notificationsGateway.sendToUser(
                  user.id,
                  'reviewReminder',
                  {
                    ...reviewDetails,
                    studyRecordId: record.id,
                    ruleId: rule.id,
                  },
                );
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

  async sendReviewReminderEmail(
    email: string,
    username: string,
    reviewDetails: ReviewReminderDetails,
    rule: ReviewRule,
  ): Promise<void> {
    const subject = `复习提醒: ${reviewDetails.itemName}`;
    this.logger.log(
      `准备发送邮件提醒给 ${email} (用户: ${username}), 项目: ${reviewDetails.itemName}, 规则: ${rule.id}`,
    );

    await this.mailerService.sendMail({
      to: email,
      subject: subject,
      template: join('review-reminder'),
      context: {
        itemName: reviewDetails.itemName,
        userName: username,
        ruleDescription:
          rule.note ||
          `${rule.value} ${rule.unit === 'DAY' ? '天' : rule.unit === 'HOUR' ? '小时' : '分钟'}后${rule.mode === 'RECURRING' ? ' (周期性)' : ''}`,
      },
    });
    this.logger.log(
      `已成功发送复习提醒邮件给 ${email} (用户: ${username}), 项目: ${reviewDetails.itemName}`,
    );
  }

  // 此处未来可以添加发送应用内通知的方法
  // async sendInAppNotification(userId: string, message: any) { ... }
}
