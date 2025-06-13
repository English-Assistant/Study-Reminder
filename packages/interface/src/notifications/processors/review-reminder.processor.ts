import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { REVIEW_REMINDER_QUEUE } from '../../queue/queue.constants';
import { NotificationsService } from '../services/notifications.service';
import { Injectable, Logger } from '@nestjs/common';

interface ReviewReminderJobData {
  userId: string;
  studyRecordId: string;
  ruleId: number;
  itemName: string;
  courseName: string;
}

@Injectable()
@Processor(REVIEW_REMINDER_QUEUE)
export class ReviewReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewReminderProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<ReviewReminderJobData>): Promise<void> {
    const data = job.data;
    this.logger.log(`处理复习提醒 Job ${job.id} for user ${data.userId}`);
    try {
      await this.notifications.sendReminderByIds(
        data.userId,
        data.studyRecordId,
        data.ruleId,
        data.itemName,
        data.courseName,
      );
    } catch (error) {
      this.logger.error('发送提醒失败', error);
      throw error;
    }
  }
}
