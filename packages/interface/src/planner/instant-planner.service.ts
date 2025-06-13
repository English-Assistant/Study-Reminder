import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewLogicService } from '../review-logic/review-logic.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  REVIEW_REMINDER_QUEUE,
  JOB_NAME_SEND_REVIEW,
} from '../queue/queue.constants';

dayjs.extend(duration);

@Injectable()
export class InstantPlannerService {
  private readonly logger = new Logger(InstantPlannerService.name);

  private readonly HOURS_WINDOW = 26; // 预测 26 小时
  private readonly CACHE_TTL_SEC = 60 * 60 * 24 * 8; // 8 天

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewLogic: ReviewLogicService,
    private readonly redis: RedisService,
    @InjectQueue(REVIEW_REMINDER_QUEUE) private readonly queue: Queue,
  ) {}

  async refreshUserPlan(userId: string) {
    this.logger.log(`增量刷新用户 ${userId} 的复习计划缓存`);
    const redisClient = this.redis.getClient();

    const now = dayjs();
    const end = now.add(this.HOURS_WINDOW, 'hour');

    // 查询所需数据
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        reviewRules: true,
        studyRecords: {
          include: {
            course: true,
          },
        },
      },
    });

    if (
      !user ||
      user.reviewRules.length === 0 ||
      user.studyRecords.length === 0
    ) {
      return;
    }

    const key = `upcoming:${userId}`;

    // 清理旧 window（可选，这里简单重建）
    await redisClient.zremrangebyscore(
      key,
      '-inf',
      now.subtract(1, 'day').valueOf(),
    );

    for (const record of user.studyRecords) {
      for (const rule of user.reviewRules) {
        let reviewTime = this.reviewLogic.calculateNextReviewTime(
          record.studiedAt,
          rule,
        );
        if (rule.mode === 'RECURRING' && reviewTime.isBefore(now)) {
          const ruleInterval = dayjs.duration(
            rule.value,
            rule.unit.toLowerCase() as dayjs.ManipulateType,
          );
          const timeDiff = now.diff(reviewTime);
          const intervalsToSkip = Math.ceil(
            timeDiff / ruleInterval.asMilliseconds(),
          );
          reviewTime = reviewTime.add(
            intervalsToSkip * ruleInterval.asMilliseconds(),
            'millisecond',
          );
        }

        if (reviewTime.isAfter(now) && reviewTime.isBefore(end)) {
          const jobId = `${userId}:${record.id}:${rule.id}:${reviewTime.valueOf()}`;
          const delay = reviewTime.diff(now);
          await this.queue.add(
            JOB_NAME_SEND_REVIEW,
            {
              userId,
              studyRecordId: record.id,
              ruleId: rule.id,
              itemName: record.textTitle,
              courseName: record.course?.name || '未知课程',
            },
            { jobId, delay, removeOnComplete: true, removeOnFail: true },
          );

          const member = JSON.stringify({
            studyRecordId: record.id,
            textTitle: record.textTitle,
            courseId: record.courseId,
            expectedReviewAt: reviewTime.toISOString(),
            ruleId: rule.id,
          });
          await redisClient.zadd(key, reviewTime.valueOf(), member);
        }
      }
    }

    await redisClient.expire(key, this.CACHE_TTL_SEC);
  }
}
