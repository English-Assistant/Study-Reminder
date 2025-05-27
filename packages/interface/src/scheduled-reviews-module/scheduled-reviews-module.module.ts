import { Module } from '@nestjs/common';
import { ScheduledReviewsModuleService } from './scheduled-reviews-module.service';
import { ScheduledReviewsModuleController } from './scheduled-reviews-module.controller';
// import { LearningActivitiesModuleModule } from '../learning-activities-module/learning-activities-module.module';
import { ReviewSettingsModuleModule } from '../review-settings-module/review-settings-module.module';
import { CoursesModuleModule } from '../courses-module/courses-module.module';

@Module({
  imports: [
    // LearningActivitiesModuleModule,
    ReviewSettingsModuleModule,
    CoursesModuleModule,
  ],
  controllers: [ScheduledReviewsModuleController],
  providers: [ScheduledReviewsModuleService],
  exports: [ScheduledReviewsModuleService], // Export if other modules need it
})
export class ScheduledReviewsModuleModule {}
