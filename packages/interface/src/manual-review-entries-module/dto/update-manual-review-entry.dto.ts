import { PartialType } from '@nestjs/mapped-types';
import { CreateManualReviewEntryDto } from './create-manual-review-entry.dto';
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class UpdateManualReviewEntryDto extends PartialType(
  CreateManualReviewEntryDto,
) {
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsDateString()
  @IsOptional()
  completedAt?: string; // Prisma schema uses DateTime, allow string input
}
