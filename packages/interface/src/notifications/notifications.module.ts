import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { ReviewLogicModule } from '../review-logic/review-logic.module';
import { BullModule } from '@nestjs/bullmq';
import { REVIEW_REMINDER_QUEUE } from '../queue/queue.constants';
import { ReviewReminderProcessor } from './processors/review-reminder.processor';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule,
    AuthModule,
    UsersModule,
    MailModule,
    ReviewLogicModule,
    BullModule.registerQueue({ name: REVIEW_REMINDER_QUEUE }),
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    ReviewReminderProcessor,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
