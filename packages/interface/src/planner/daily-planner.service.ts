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

/**
 * 每日计划服务（DailyPlanner）
 * ------------------------------------------------------------
 * 每天 00:10 全量为所有用户计算接下来 26h 的复习任务，
 * 作为 InstantPlanner 的兜底，防止服务器重启或漏算。
 */
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

  /**
   * Cron 入口：每天凌晨 00:10 执行
   * 1. 遍历所有用户 → 重新计算未来 26 小时任务
   * 2. reviewTime 写 Redis，sendTime 入 BullMQ
   * 3. 覆盖 InstantPlanner 可能遗漏的情况
   */
  @Cron('10 0 * * *')
  async handleCron() {
    this.logger.log('DailyPlanner 开始批量计算未来 26 小时复习计划');
    const redisClient = this.redis.getClient();

    const now = dayjs();
    const end = now.add(this.HOURS_WINDOW, 'hour');

    // 查询所有用户及其复习相关数据
    const users = await this.prisma.user.findMany({
      include: {
        reviewRules: true,
        studyTimeWindows: true,
        studyRecords: {
          include: { course: true },
        },
      },
    });

    for (const user of users) {
      if (!user.reviewRules.length || !user.studyRecords.length) continue;
      const cacheKey = `upcoming:${user.id}`;
      await redisClient.del(cacheKey); // 重建

      // 遍历所有学习记录和规则，计算每条记录的下次复习时间
      for (const record of user.studyRecords) {
        for (const rule of user.reviewRules) {
          let nextReviewTime = this.reviewLogic.calculateNextReviewTime(
            record.studiedAt,
            rule,
          );

          // 不断计算下一次复习时间，直到它超出我们的调度窗口
          while (nextReviewTime.isBefore(end)) {
            // 只有在未来的、且在窗口内的任务才需要被调度
            if (nextReviewTime.isAfter(now)) {
              const sendTime = this.reviewLogic.adjustTimeForWindows(
                nextReviewTime,
                user.studyTimeWindows,
              );

              const jobId = `${user.id}:${
                record.id
              }:${rule.id}:${sendTime.valueOf()}`;
              const delay = sendTime.diff(now);
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
                expectedReviewAt: nextReviewTime.toISOString(),
                ruleId: rule.id,
              });
              await redisClient.zadd(
                cacheKey,
                nextReviewTime.valueOf(),
                member,
              );
            }

            // 如果不是循环规则，计算一次就够了
            if (rule.mode !== 'RECURRING') {
              break;
            }

            // 准备下一次循环
            nextReviewTime = this.reviewLogic.addInterval(
              nextReviewTime,
              rule.value,
              rule.unit,
            );
          }
        }
      }
      await redisClient.expire(cacheKey, this.CACHE_TTL_SEC);
    }

    this.logger.log('DailyPlanner 完成批量计算');
  }
}
