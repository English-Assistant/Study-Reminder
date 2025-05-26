import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduledReviewsModuleDto } from './create-scheduled-reviews-module.dto';

export class UpdateScheduledReviewsModuleDto extends PartialType(
  CreateScheduledReviewsModuleDto,
) {}
