import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewSettingsModuleDto } from './create-review-settings-module.dto';

export class UpdateReviewSettingsModuleDto extends PartialType(
  CreateReviewSettingsModuleDto,
) {}
