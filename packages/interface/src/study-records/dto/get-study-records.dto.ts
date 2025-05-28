import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetStudyRecordsDto {
  @IsOptional()
  @IsUUID('4', { message: 'courseId 必须是有效的 UUIDv4' })
  courseId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'filterDate 必须是 YYYY-MM-DD 格式',
  })
  filterDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'addedWithinDays 必须是整数' })
  @Min(1, { message: 'addedWithinDays 至少为 1' })
  @Max(365, { message: 'addedWithinDays 不能超过 365' })
  addedWithinDays?: number;
}
