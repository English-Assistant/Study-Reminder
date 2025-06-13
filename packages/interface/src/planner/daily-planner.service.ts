import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ReviewLogicService } from '../review-logic/review-logic.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  REVIEW_REMINDER_QUEUE,
  JOB_NAME_SEND_REVIEW,
} from '../queue/queue.constants';

dayjs.extend(duration);

@Injectable()
export class DailyPlannerService {
  private readonly logger = new Logger(DailyPlannerService.name);

  private readonly HOURS_WINDOW = 26;
  private readonly CACHE_TTL_SEC = 60 * 60 * 24 * 8; // 8 天

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly reviewLogic: ReviewLogicService,
    @InjectQueue(REVIEW_REMINDER_QUEUE) private readonly queue: Queue,
  ) {}

  // 每天 00:10 运行
  @Cron('10 0 * * *')
  async handleCron() {
    this.logger.log('DailyPlanner 开始批量计算未来 26 小时复习计划');
    const redisClient = this.redis.getClient();

    const now = dayjs();
    const end = now.add(this.HOURS_WINDOW, 'hour');

    const users = await this.prisma.user.findMany({
      include: {
        reviewRules: true,
        studyRecords: {
          include: { course: true },
        },
      },
    });

    for (const user of users) {
      if (!user.reviewRules.length || !user.studyRecords.length) continue;
      const cacheKey = `upcoming:${user.id}`;
      await redisClient.del(cacheKey); // 重建

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
            const diff = now.diff(reviewTime);
            const intervals = Math.ceil(diff / ruleInterval.asMilliseconds());
            reviewTime = reviewTime.add(
              intervals * ruleInterval.asMilliseconds(),
              'millisecond',
            );
          }
          if (reviewTime.isAfter(now) && reviewTime.isBefore(end)) {
            const jobId = `${user.id}:${record.id}:${rule.id}:${reviewTime.valueOf()}`;
            const delay = reviewTime.diff(now);
            await this.queue.add(
              JOB_NAME_SEND_REVIEW,
              {
                userId: user.id,
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
              courseName: record.course?.name,
              expectedReviewAt: reviewTime.toISOString(),
              ruleId: rule.id,
            });
            await redisClient.zadd(cacheKey, reviewTime.valueOf(), member);
          }
        }
      }
      await redisClient.expire(cacheKey, this.CACHE_TTL_SEC);
    }

    this.logger.log('DailyPlanner 完成批量计算');
  }
}
