import { ReviewItemDto } from './review-item.dto';

class CourseReviewGroup {
  courseId!: string;
  courseName!: string;
  courseColor!: string | null;
  reviews!: ReviewItemDto[];
}

export class GroupedUpcomingReviewsDto {
  date!: string;
  courses!: CourseReviewGroup[];
}
