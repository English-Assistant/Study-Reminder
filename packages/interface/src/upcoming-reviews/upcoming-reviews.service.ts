import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewRule, IntervalUnit, ReviewMode } from '@prisma/client';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import { UpcomingReviewDto } from './dto/upcoming-review.dto';

dayjs.extend(customParseFormat);

@Injectable()
export class UpcomingReviewsService {
  private readonly logger = new Logger(UpcomingReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private calculateNextReviewTime(
    studiedAt: Date,
    rule: ReviewRule,
    now: dayjs.Dayjs,
  ): dayjs.Dayjs | null {
    const baseTime = dayjs(studiedAt).second(0).millisecond(0);
    let expectedTime = this.addInterval(baseTime, rule.value, rule.unit);

    if (rule.mode === ReviewMode.ONCE) {
      return expectedTime.isAfter(now) ? expectedTime : null;
    }

    if (rule.mode === ReviewMode.RECURRING) {
      if (expectedTime.isAfter(now)) {
        return expectedTime;
      }
      // 循环找到未来的第一个复习时间点
      while (expectedTime.isBefore(now) || expectedTime.isSame(now, 'minute')) {
        expectedTime = this.addInterval(expectedTime, rule.value, rule.unit);
      }
      return expectedTime;
    }
    return null;
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
        return date;
    }
    return date.add(value, dayjsUnit);
  }

  private getRuleDescription(rule: ReviewRule): string {
    const unitMap = {
      [IntervalUnit.MINUTE]: '分钟',
      [IntervalUnit.HOUR]: '小时',
      [IntervalUnit.DAY]: '天',
    };
    const modeMap = {
      [ReviewMode.ONCE]: '一次性',
      [ReviewMode.RECURRING]: '周期性',
    };
    return `${rule.value} ${unitMap[rule.unit]}后 (${modeMap[rule.mode]}) - ${rule.note || '无备注'}`;
  }

  async getUpcomingReviews(
    userId: string,
    withinDays: number,
  ): Promise<UpcomingReviewDto[]> {
    this.logger.log(
      `Fetching upcoming reviews for user ${userId} within ${withinDays} days.`,
    );
    const now = dayjs();
    const endDateLimit = now.add(withinDays, 'day').endOf('day');

    const userWithData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studyRecords: {
          include: {
            course: true, // 包含课程信息以获取课程名称
          },
          orderBy: { studiedAt: 'desc' }, // 获取最新的学习记录优先处理可能更优，但此处对结果无影响
        },
        reviewRules: true,
      },
    });

    if (!userWithData) {
      this.logger.warn(`User ${userId} not found for upcoming reviews.`);
      return [];
    }

    const { studyRecords, reviewRules } = userWithData;
    if (!studyRecords.length || !reviewRules.length) {
      return [];
    }

    const upcomingReviews: UpcomingReviewDto[] = [];

    for (const record of studyRecords) {
      if (!record.course) {
        this.logger.warn(
          `Study record ${record.id} for user ${userId} is missing course data.`,
        );
        continue;
      }
      for (const rule of reviewRules) {
        const expectedReviewAtDayjs = this.calculateNextReviewTime(
          record.studiedAt,
          rule,
          now,
        );

        if (
          expectedReviewAtDayjs &&
          expectedReviewAtDayjs.isBefore(endDateLimit)
        ) {
          upcomingReviews.push({
            studyRecordId: record.id,
            textTitle: record.textTitle,
            courseId: record.courseId,
            courseName: record.course.name,
            expectedReviewAt: expectedReviewAtDayjs.toDate(),
            ruleId: rule.id,
            ruleDescription: this.getRuleDescription(rule),
          });
        }
      }
    }
    // 按预计复习时间升序排序
    return upcomingReviews.sort(
      (a, b) =>
        dayjs(a.expectedReviewAt).valueOf() -
        dayjs(b.expectedReviewAt).valueOf(),
    );
  }
}
