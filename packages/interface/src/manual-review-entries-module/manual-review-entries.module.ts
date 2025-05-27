import { Module } from '@nestjs/common';
import { ManualReviewEntriesService } from './services/manual-review-entries.service';
import { ManualReviewEntriesController } from './controllers/manual-review-entries.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ManualReviewEntriesController],
  providers: [ManualReviewEntriesService],
  exports: [ManualReviewEntriesService], // 如果其他模块可能需要直接使用此服务
})
export class ManualReviewEntriesModule {}
