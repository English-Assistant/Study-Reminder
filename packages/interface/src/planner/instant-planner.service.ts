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

    type ReviewItem = {
      reviewTime: dayjs.Dayjs;
      itemName: string;
      courseName: string;
    };
    const GAP_MS = 5 * 60 * 1000; // 5 分钟滑动窗口
    const candidates: ReviewItem[] = [];

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
          // 写入 Redis ZSET 单条（前端日历用）
          const member = JSON.stringify({
            studyRecordId: record.id,
            textTitle: record.textTitle,
            courseId: record.courseId,
            expectedReviewAt: reviewTime.toISOString(),
            ruleId: rule.id,
          });
          await redisClient.zadd(key, reviewTime.valueOf(), member);

          // 收集到候选列表，稍后做滑动窗口聚合
          candidates.push({
            reviewTime,
            itemName: record.textTitle,
            courseName: record.course?.name || '未知课程',
          });
        }
      }
    }

    // ---------- 滑动窗口聚合 ----------
    if (candidates.length) {
      // 按时间升序
      candidates.sort(
        (a, b) => a.reviewTime.valueOf() - b.reviewTime.valueOf(),
      );

      let groupStartTs = candidates[0].reviewTime.valueOf();
      let currentGroup: Omit<ReviewItem, 'reviewTime'>[] = [];

      const flushGroup = async () => {
        if (currentGroup.length === 0) return;
        const delay = groupStartTs - now.valueOf();
        if (delay < 0) return; // 应该不会发生，安全判断
        const jobId = `${userId}:${groupStartTs}`;
        await this.queue.add(
          JOB_NAME_SEND_REVIEW,
          {
            userId,
            items: currentGroup,
          },
          { jobId, delay, removeOnComplete: true, removeOnFail: true },
        );
        currentGroup = [];
      };

      for (const item of candidates) {
        if (currentGroup.length === 0) {
          groupStartTs = item.reviewTime.valueOf();
          currentGroup.push({
            itemName: item.itemName,
            courseName: item.courseName,
          });
          continue;
        }

        const diff = item.reviewTime.valueOf() - groupStartTs;
        if (diff <= GAP_MS) {
          // 仍在窗口内，合并
          currentGroup.push({
            itemName: item.itemName,
            courseName: item.courseName,
          });
          // 更新 groupStartTs 以链式延长窗口
          groupStartTs = item.reviewTime.valueOf();
        } else {
          // 超出窗口，先推送已有分组
          await flushGroup();
          // 开启新分组
          groupStartTs = item.reviewTime.valueOf();
          currentGroup.push({
            itemName: item.itemName,
            courseName: item.courseName,
          });
        }
      }
      // flush last
      await flushGroup();
    }

    await redisClient.expire(key, this.CACHE_TTL_SEC);
  }
}
