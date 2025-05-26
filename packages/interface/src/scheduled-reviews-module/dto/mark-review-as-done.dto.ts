import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class MarkReviewAsDoneDto {
  @IsString()
  @IsNotEmpty()
  scheduledReviewId!: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // 还需要 courseId 吗？ 如果 scheduledReviewId 已经是全局唯一的，可能不需要。
  // 但如果标记完成需要在 LearningActivity 中记录，而 scheduledReviewId 只是一个临时计算的ID，
  // 那么可能需要 courseId 和其他信息来创建 LearningActivity。
  // 暂时假设 scheduledReviewId 包含足够信息或服务端可以从中推断所需信息。
}
