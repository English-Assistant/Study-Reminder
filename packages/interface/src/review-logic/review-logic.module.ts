import { Module } from '@nestjs/common';
import { ReviewLogicService } from './review-logic.service';

@Module({
  providers: [ReviewLogicService],
  exports: [ReviewLogicService],
})
export class ReviewLogicModule {}
