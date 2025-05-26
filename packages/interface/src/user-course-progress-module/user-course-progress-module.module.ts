import { Module } from '@nestjs/common';
import { UserCourseProgressModuleService } from './user-course-progress-module.service';
import { UserCourseProgressModuleController } from './user-course-progress-module.controller';

@Module({
  controllers: [UserCourseProgressModuleController],
  providers: [UserCourseProgressModuleService],
  exports: [UserCourseProgressModuleService],
})
export class UserCourseProgressModuleModule {}
