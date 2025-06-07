import { Module } from '@nestjs/common';
import { UpcomingReviewsService } from './upcoming-reviews.service';
import { UpcomingReviewsController } from './upcoming-reviews.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 假设 PrismaService 在 PrismaModule 中提供
import { ReviewLogicModule } from '../review-logic/review-logic.module';

@Module({
  imports: [PrismaModule, ReviewLogicModule],
  controllers: [UpcomingReviewsController],
  providers: [UpcomingReviewsService],
})
export class UpcomingReviewsModule {}
