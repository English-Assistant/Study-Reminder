import { PartialType } from '@nestjs/mapped-types';
import { CreateLearningActivitiesModuleDto } from './create-learning-activities-module.dto';

export class UpdateLearningActivitiesModuleDto extends PartialType(
  CreateLearningActivitiesModuleDto,
) {}
