import { Module } from '@nestjs/common';
import { InstantPlannerService } from './instant-planner.service';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewLogicModule } from '../review-logic/review-logic.module';
import { BullModule } from '@nestjs/bullmq';
import { DailyPlannerService } from './daily-planner.service';
import { REVIEW_REMINDER_QUEUE } from '../queue/queue.constants';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    ReviewLogicModule,
    BullModule.registerQueue({ name: REVIEW_REMINDER_QUEUE }),
  ],
  providers: [InstantPlannerService, DailyPlannerService],
  exports: [InstantPlannerService],
})
export class PlannerModule {}
