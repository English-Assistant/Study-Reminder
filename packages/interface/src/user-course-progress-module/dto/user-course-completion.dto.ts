import { IsString, IsDateString, IsUUID } from 'class-validator';

export class UserCourseCompletionDto {
  @IsUUID()
  courseId!: string;

  @IsString()
  courseName!: string; // Will be populated by joining with Course table

  @IsDateString()
  completedAt!: string;

  // Can include other relevant fields from UserCourseCompletion or Course if needed
}
