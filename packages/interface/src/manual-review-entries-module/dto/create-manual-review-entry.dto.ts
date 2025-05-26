import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsDateString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateManualReviewEntryDto {
  @IsUUID('4', { message: 'courseId 必须是有效的UUID' })
  @IsNotEmpty({ message: 'courseId 不能为空' })
  courseId!: string;

  @IsString({ message: '标题必须是字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(255)
  title!: string;

  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsDateString(
    {},
    { message: 'reviewDate 必须是有效的 ISO 日期字符串 (例如 YYYY-MM-DD)' },
  )
  @IsNotEmpty({ message: 'reviewDate 不能为空' })
  reviewDate!: string; // Prisma schema uses DateTime, but for input, we can take YYYY-MM-DD string and convert

  @IsString({ message: 'reviewTime 必须是字符串' })
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'reviewTime 必须是有效的 HH:mm 格式 (例如 09:30 或 14:00)',
  })
  reviewTime?: string;
}
