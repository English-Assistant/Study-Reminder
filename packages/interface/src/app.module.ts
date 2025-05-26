import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModuleModule } from './auth-module/auth-module.module';
import { UsersModuleModule } from './users-module/users-module.module';
import { CoursesModuleModule } from './courses-module/courses-module.module';
import { ReviewSettingsModuleModule } from './review-settings-module/review-settings-module.module';
import { LearningActivitiesModuleModule } from './learning-activities-module/learning-activities-module.module';
import { ScheduledReviewsModuleModule } from './scheduled-reviews-module/scheduled-reviews-module.module';
import { UserCourseProgressModuleModule } from './user-course-progress-module/user-course-progress-module.module';
import { ManualReviewEntriesModuleModule } from './manual-review-entries-module/manual-review-entries-module.module';
import { UserStatisticsModuleModule } from './user-statistics-module/user-statistics-module.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModuleModule,
    UsersModuleModule,
    CoursesModuleModule,
    ReviewSettingsModuleModule,
    LearningActivitiesModuleModule,
    ScheduledReviewsModuleModule,
    UserCourseProgressModuleModule,
    ManualReviewEntriesModuleModule,
    UserStatisticsModuleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
