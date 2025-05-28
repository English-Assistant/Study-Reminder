import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStudyRecordDto {
  @IsString()
  @IsNotEmpty({ message: '课程ID不能为空' })
  courseId!: string;

  @IsDateString({}, { message: '打卡时间必须是有效的ISO8601日期时间字符串' })
  @IsNotEmpty({ message: '打卡时间不能为空' })
  studiedAt!: string; // Prisma expects Date, but string input is often easier for client

  @IsString()
  @IsNotEmpty({ message: '课文标题不能为空' })
  textTitle!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
