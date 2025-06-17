import type { CourseSummaryDto } from '../../study-records/dto/study-records-by-month-response.dto';
import type { ReviewItemDto } from './review-item.dto';

export interface CourseReviewsDto {
  courseId: string;
  reviews: ReviewItemDto[];
}

export interface DateUpcomingReviewsDto {
  date: string; // YYYY-MM-DD
  courses: CourseReviewsDto[];
}

export interface UpcomingReviewsResponseDto {
  courses: CourseSummaryDto[];
  dates: DateUpcomingReviewsDto[];
}
