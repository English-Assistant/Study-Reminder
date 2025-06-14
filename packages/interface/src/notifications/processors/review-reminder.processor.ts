import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { REVIEW_REMINDER_QUEUE } from '../../queue/queue.constants';
import { NotificationsService } from '../services/notifications.service';
import { Injectable, Logger } from '@nestjs/common';
import { ReviewItem } from '../types/review-item.type';

interface ReviewReminderJobData {
  userId: string;
  items: ReviewItem[];
}

@Injectable()
@Processor(REVIEW_REMINDER_QUEUE)
export class ReviewReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewReminderProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  /**
   * BullMQ Worker 入口：消费复习提醒 Job。
   * Job.data 由 Planner 侧生成：
   *   - items.length === 1  → 单条邮件
   *   - items.length >= 2  → 合并邮件
   */
  async process(job: Job<ReviewReminderJobData>): Promise<void> {
    const { userId, items } = job.data;
    this.logger.log(
      `处理复习提醒 Job ${job.id} for user ${userId}, items: ${items.length}`,
    );
    try {
      await this.notifications.sendBulkReminder(userId, items);
    } catch (error) {
      this.logger.error('发送提醒失败', error);
      throw error;
    }
  }
}
