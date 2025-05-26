import { IsString, IsDateString, IsUUID, IsOptional } from 'class-validator';

export class ScheduledReviewDto {
  @IsString()
  id!: string;

  @IsUUID()
  courseId!: string;

  @IsString()
  courseName!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsUUID()
  @IsOptional()
  originalLearningActivityId?: string;

  @IsUUID()
  @IsOptional()
  reviewRuleId?: string;

  @IsString()
  @IsOptional()
  ruleDescription?: string;

  @IsOptional()
  repetitionCycle?: number;
}
