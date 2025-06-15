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
import { ensureFutureRecurringTime } from '../common/utils/recurring.util';
import { ReviewItem as BaseReviewItem } from '../notifications/types/review-item.type';

dayjs.extend(duration);

/**
 * 即时计划服务（InstantPlanner）
 * ------------------------------------------------------------
 * 1. 在用户的复习规则、学习记录或学习时间段变动时被触发（见 PrismaWatchMiddleware）。
 * 2. 重新计算接下来 26 小时内的所有复习任务。
 *    - reviewTime  : 学术意义上的复习时间，写入 Redis，供前端日历 / 统计使用。
 *    - sendTime    : 根据学习时间段窗口调整后的实际通知发送时间，写入 BullMQ 延时队列。
 * 3. 同一用户 5 分钟内的任务将滑动窗口合并为一条 Job，减少邮件 / WebSocket 轰炸。
 */
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

  /**
   * 增量刷新指定用户未来 26 小时的复习计划。
   * 调用场景：打卡、规则/学习时间段 CRUD 时由 PrismaWatchMiddleware 触发。
   * @param userId 目标用户 ID
   */
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
        studyTimeWindows: true,
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

    // ---------- 清理旧的延时任务（该用户） ----------
    const existingJobs = await this.queue.getJobs(['delayed', 'waiting']);
    for (const job of existingJobs) {
      if (!job.id) continue;
      if (typeof job.id === 'string' && job.id.startsWith(`${userId}:`)) {
        const ts = Number(job.id.split(':')[1]);
        if (!isNaN(ts) && ts >= now.valueOf() && ts <= end.valueOf()) {
          await job.remove();
        }
      }
    }

    type ReviewItem = BaseReviewItem & {
      sendTime: dayjs.Dayjs; // 实际通知时间，已按学习时间段调整
    };
    const GAP_MS = 5 * 60 * 1000; // 5 分钟滑动窗口（链接式）
    const candidates: ReviewItem[] = [];

    for (const record of user.studyRecords) {
      for (const rule of user.reviewRules) {
        let reviewTime = this.reviewLogic.calculateNextReviewTime(
          record.studiedAt,
          rule,
        );
        reviewTime = ensureFutureRecurringTime(reviewTime, rule, now);

        // 计算实际发送时间
        const sendTime = this.reviewLogic.adjustTimeForWindows(
          reviewTime,
          user.studyTimeWindows,
        );

        if (sendTime.isAfter(now) && sendTime.isBefore(end)) {
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
            sendTime,
            itemName: record.textTitle,
            courseName: record.course?.name || '未知课程',
            time: reviewTime.format('HH:mm'),
          });
        }
      }
    }

    // ---------- 滑动窗口聚合 ----------
    if (candidates.length) {
      // 按时间升序
      candidates.sort((a, b) => a.sendTime.valueOf() - b.sendTime.valueOf());

      let groupStartTs = candidates[0].sendTime.valueOf();
      let currentGroup: Omit<ReviewItem, 'sendTime'>[] = [];

      // 将 currentGroup 任务提交到队列并清空
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
          groupStartTs = item.sendTime.valueOf();
          currentGroup.push({
            itemName: item.itemName,
            courseName: item.courseName,
            time: item.time,
          });
          continue;
        }

        const diff = item.sendTime.valueOf() - groupStartTs;
        if (diff <= GAP_MS) {
          // 仍在窗口内，合并
          currentGroup.push({
            itemName: item.itemName,
            courseName: item.courseName,
            time: item.time,
          });
          // 更新 groupStartTs 以链式延长窗口
          groupStartTs = item.sendTime.valueOf();
        } else {
          // 超出窗口，先推送已有分组
          await flushGroup();
          // 开启新分组
          groupStartTs = item.sendTime.valueOf();
          currentGroup.push({
            itemName: item.itemName,
            courseName: item.courseName,
            time: item.time,
          });
        }
      }
      // 处理最后一组剩余任务
      await flushGroup();
    }

    await redisClient.expire(key, this.CACHE_TTL_SEC);
  }
}
