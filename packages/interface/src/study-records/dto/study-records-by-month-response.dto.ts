import type { Course } from '@prisma/client';

export type CourseSummaryDto = Omit<Course, 'userId' | 'createdAt'>;

import type { StudyRecordWithReviewsDto } from './study-record-with-reviews.dto';

export interface StudyRecordsByMonthResponseDto {
  courses: CourseSummaryDto[];
  records: StudyRecordWithReviewsDto[];
}
