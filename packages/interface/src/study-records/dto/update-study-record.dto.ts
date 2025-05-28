import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateStudyRecordDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsDateString({}, { message: '打卡时间必须是有效的ISO8601日期时间字符串' })
  studiedAt?: string;

  @IsOptional()
  @IsString()
  textTitle?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
