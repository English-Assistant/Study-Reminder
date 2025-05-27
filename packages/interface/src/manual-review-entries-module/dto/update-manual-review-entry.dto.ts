import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class UpdateManualReviewEntryDto {
  @ApiPropertyOptional({ description: '复习条目标题', example: '更新后的标题' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @ApiPropertyOptional({
    description: '复习条目详细描述',
    example: '更新后的描述',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '计划复习的日期 (ISO 8601 格式)',
    example: '2025-01-15T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @ApiPropertyOptional({
    description: '具体的复习时间 (HH:mm 格式)',
    example: '16:45',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '时间格式必须为 HH:mm' })
  reviewTime?: string;

  @ApiPropertyOptional({ description: '关联的课程ID (UUID格式)' })
  @IsOptional()
  @IsUUID('4', { message: '课程ID必须是有效的UUID' })
  courseId?: string;

  // completedAt 应该由后端在 isCompleted 变为 true 时自动设置，通常不通过 DTO 直接传入。
  // 如果需要手动覆盖，可以添加，但不推荐。
}
