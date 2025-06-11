import { IsString, IsDate, IsNumber } from 'class-validator';

export class UpcomingReviewDto {
  @IsString()
  studyRecordId!: string;

  @IsString()
  textTitle!: string;

  @IsString()
  courseId!: string;

  @IsString()
  courseName!: string; // 假设我们会从课程关联中获取

  @IsString()
  courseColor!: string | null;

  @IsDate()
  expectedReviewAt!: Date;

  @IsNumber()
  ruleId!: number;

  @IsString()
  ruleDescription!: string | null;
}
