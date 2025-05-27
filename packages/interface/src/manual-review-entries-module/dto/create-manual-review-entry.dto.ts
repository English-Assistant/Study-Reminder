import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsDateString,
  Matches,
  Length,
} from 'class-validator';

export class CreateManualReviewEntryDto {
  @ApiProperty({
    description: '复习条目标题',
    example: '复习第一单元单词',
  })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiPropertyOptional({
    description: '复习条目详细描述',
    example: '重点记忆过去式和过去分词',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '计划复习的日期 (ISO 8601 格式)',
    example: '2024-12-31T10:00:00.000Z',
  })
  @IsNotEmpty({ message: '复习日期不能为空' })
  @IsDateString()
  reviewDate: string; // 在 service 层会转换为 Date 对象

  @ApiPropertyOptional({
    description: '具体的复习时间 (HH:mm 格式)',
    example: '14:30',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '时间格式必须为 HH:mm' })
  reviewTime?: string;

  @ApiProperty({
    description: '关联的课程ID (UUID格式)',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @IsNotEmpty({ message: '课程ID不能为空' })
  @IsUUID('4', { message: '课程ID必须是有效的UUID' })
  courseId: string;
}
