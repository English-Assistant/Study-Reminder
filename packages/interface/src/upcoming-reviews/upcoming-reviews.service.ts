import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewRule, ReviewMode } from '@prisma/client';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { UpcomingReviewDto } from './dto/upcoming-review.dto';
import { getRuleDescription } from '../common/review-rule.util';
import { addInterval } from '../common/date.util';
import { GroupedUpcomingReviewsDto } from './dto/grouped-upcoming-reviews.dto';
import { groupBy, map, sortBy } from 'lodash';

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
    let expectedTime = addInterval(baseTime, rule.value, rule.unit);

    if (rule.mode === ReviewMode.ONCE) {
      return expectedTime.isAfter(now) ? expectedTime : null;
    }

    if (rule.mode === ReviewMode.RECURRING) {
      if (expectedTime.isAfter(now)) {
        return expectedTime;
      }
      // 循环找到未来的第一个复习时间点
      while (expectedTime.isBefore(now) || expectedTime.isSame(now, 'minute')) {
        expectedTime = addInterval(expectedTime, rule.value, rule.unit);
      }
      return expectedTime;
    }
    return null;
  }

  async getUpcomingReviews(
    userId: string,
    withinDays: number,
  ): Promise<GroupedUpcomingReviewsDto[]> {
    this.logger.log(
      `正在获取用户 ${userId} 在 ${withinDays} 天内的待复习项目。`,
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
      this.logger.warn(`未找到用户 ${userId} 的待复习项目。`);
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
          `用户 ${userId} 的学习记录 ${record.id} 缺少课程数据。`,
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
            courseColor: record.course.color,
            expectedReviewAt: expectedReviewAtDayjs.toDate(),
            ruleId: rule.id,
            ruleDescription: getRuleDescription(rule),
          });
        }
      }
    }
    // 按预计复习时间升序排序
    const sortedReviews = upcomingReviews.sort(
      (a, b) =>
        dayjs(a.expectedReviewAt).valueOf() -
        dayjs(b.expectedReviewAt).valueOf(),
    );

    // 按日期分组
    const groupedByDate = groupBy(sortedReviews, (review) =>
      dayjs(review.expectedReviewAt).format('YYYY-MM-DD'),
    );

    // 转换为最终的数据结构
    const result: GroupedUpcomingReviewsDto[] = map(
      groupedByDate,
      (reviews, date) => {
        // 在每个日期下，再按课程ID分组
        const groupedByCourse = groupBy(reviews, 'courseId');

        return {
          date,
          courses: map(groupedByCourse, (courseReviews, courseId) => ({
            courseId,
            courseName: courseReviews[0].courseName, // 同一个课程的信息是一样的
            courseColor: courseReviews[0].courseColor,
            reviews: sortBy(courseReviews, 'expectedReviewAt').map((r) => ({
              studyRecordId: r.studyRecordId,
              textTitle: r.textTitle,
              expectedReviewAt: r.expectedReviewAt,
              ruleId: r.ruleId,
              ruleDescription: r.ruleDescription,
            })),
          })),
        };
      },
    );

    return sortBy(result, 'date'); // 按日期排序最终结果
  }
}
