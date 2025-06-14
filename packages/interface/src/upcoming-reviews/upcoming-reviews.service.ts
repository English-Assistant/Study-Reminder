import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);
import { ensureFutureRecurringTime } from '../common/utils/recurring.util';
import { UpcomingReviewDto } from './dto/upcoming-review.dto';
import { getRuleDescription } from '../common/review-rule.util';
import { GroupedUpcomingReviewsDto } from './dto/grouped-upcoming-reviews.dto';
import { groupBy, map, sortBy } from 'lodash';
import { ReviewLogicService } from '../review-logic/review-logic.service';

/**
 * UpcomingReviewsService
 * ------------------------------------------------------------
 * 1. 首先尝试从 Redis 读取缓存的 reviewTime 列表。
 * 2. 若缓存缺失则实时计算未来 withinDays 天的复习任务并返回给前端。
 * 3. 支持分组按日期 -> 课程，供日历视图使用。
 */
@Injectable()
export class UpcomingReviewsService {
  private readonly logger = new Logger(UpcomingReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewLogicService: ReviewLogicService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 获取未来 N 天内的待复习任务（优先读缓存，缺失则实时计算）
   */
  async getUpcomingReviews(
    userId: string,
    withinDays: number,
  ): Promise<GroupedUpcomingReviewsDto[]> {
    this.logger.log(
      `正在获取用户 ${userId} 在 ${withinDays} 天内的待复习项目。`,
    );

    const redisClient = this.redis.getClient();
    const startTs = dayjs().startOf('day').valueOf();
    const endTs = dayjs().startOf('day').add(withinDays, 'day').valueOf();
    const cacheKey = `upcoming:${userId}`;

    try {
      const cached = await redisClient.zrangebyscore(cacheKey, startTs, endTs);
      if (cached && cached.length > 0) {
        // 后续会补实现缓存解析逻辑，目前直接跳过实时计算。
        // 为保持接口正确，暂时继续走实时计算分支。
      }
    } catch {
      this.logger.warn('读取 Redis 缓存失败，回退到实时计算');
    }

    const startOfToday = dayjs().startOf('day');
    const endDateLimit = startOfToday.add(withinDays - 1, 'day').endOf('day');

    // 查询用户的学习记录和复习规则
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

    // 遍历所有学习记录和规则，计算每条记录的下次复习时间
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
          );

        // 使用 util 保证循环规则时间位于未来
        expectedReviewAtDayjs = ensureFutureRecurringTime(
          expectedReviewAtDayjs,
          rule,
          startOfToday,
        );

        if (expectedReviewAtDayjs) {
          expectedReviewAtDayjs =
            this.reviewLogicService.adjustReviewTimeForStudyWindows(
              expectedReviewAtDayjs,
            );
        }

        if (
          expectedReviewAtDayjs &&
          expectedReviewAtDayjs.isAfter(startOfToday) && // 确保时间在今天零点之后
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
            reviews: sortBy(courseReviews, (r) =>
              dayjs(r.expectedReviewAt).valueOf(),
            ).map((r) => ({
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
