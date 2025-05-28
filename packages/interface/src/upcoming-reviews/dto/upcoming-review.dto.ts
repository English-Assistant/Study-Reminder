import { IsString, IsDate } from 'class-validator';

export class UpcomingReviewDto {
  @IsString()
  studyRecordId!: string;

  @IsString()
  textTitle!: string;

  @IsString()
  courseId!: string;

  @IsString()
  courseName!: string; // 假设我们会从课程关联中获取

  @IsDate()
  expectedReviewAt!: Date;

  @IsString()
  ruleId!: string;

  @IsString()
  ruleDescription!: string;
}
