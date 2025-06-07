import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';
import { UpcomingReviewDto } from './dto/upcoming-review.dto';
import { getRuleDescription } from '../common/review-rule.util';
import { GroupedUpcomingReviewsDto } from './dto/grouped-upcoming-reviews.dto';
import { groupBy, map, sortBy } from 'lodash';
import { ReviewLogicService } from '../review-logic/review-logic.service';

@Injectable()
export class UpcomingReviewsService {
  private readonly logger = new Logger(UpcomingReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewLogicService: ReviewLogicService,
  ) {}

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
            course: true,
          },
          orderBy: { studiedAt: 'desc' },
        },
        reviewRules: true,
        studyTimeWindows: true,
      },
    });

    if (!userWithData) {
      this.logger.warn(`未找到用户 ${userId} 的待复习项目。`);
      return [];
    }

    const { studyRecords, reviewRules, studyTimeWindows } = userWithData;
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
        let expectedReviewAtDayjs =
          this.reviewLogicService.calculateNextReviewTime(
            record.studiedAt,
            rule,
            now,
          );

        if (expectedReviewAtDayjs) {
          expectedReviewAtDayjs =
            this.reviewLogicService.adjustReviewTimeForStudyWindows(
              expectedReviewAtDayjs,
              studyTimeWindows,
            );
        }

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
