import { Module } from '@nestjs/common';
import { LearningActivitiesModuleService } from './learning-activities-module.service';
import { LearningActivitiesModuleController } from './learning-activities-module.controller';

@Module({
  controllers: [LearningActivitiesModuleController],
  providers: [LearningActivitiesModuleService],
  exports: [LearningActivitiesModuleService],
})
export class LearningActivitiesModuleModule {}
