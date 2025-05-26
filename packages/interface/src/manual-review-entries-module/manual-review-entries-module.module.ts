import { Module } from '@nestjs/common';
import { ManualReviewEntriesModuleService } from './manual-review-entries-module.service';
import { ManualReviewEntriesModuleController } from './manual-review-entries-module.controller';
// PrismaModule is likely global, so no need to import here unless specifically scoped

@Module({
  controllers: [ManualReviewEntriesModuleController],
  providers: [ManualReviewEntriesModuleService],
  exports: [ManualReviewEntriesModuleService], // Export if other modules need it
})
export class ManualReviewEntriesModuleModule {}
