import { Module } from '@nestjs/common';
import { UserStatisticsModuleService } from './user-statistics-module.service';
import { UserStatisticsModuleController } from './user-statistics-module.controller';
import { LearningActivitiesModuleModule } from '../learning-activities-module/learning-activities-module.module';
import { UserCourseProgressModuleModule } from '../user-course-progress-module/user-course-progress-module.module';

@Module({
  imports: [
    LearningActivitiesModuleModule, // For LearningActivitiesModuleService
    UserCourseProgressModuleModule, // For UserCourseProgressModuleService
  ],
  controllers: [UserStatisticsModuleController],
  providers: [UserStatisticsModuleService],
  exports: [UserStatisticsModuleService],
})
export class UserStatisticsModuleModule {}
