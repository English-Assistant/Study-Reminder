import { PartialType } from '@nestjs/mapped-types';
import { CreateManualReviewEntriesModuleDto } from './create-manual-review-entries-module.dto';

export class UpdateManualReviewEntriesModuleDto extends PartialType(
  CreateManualReviewEntriesModuleDto,
) {}
