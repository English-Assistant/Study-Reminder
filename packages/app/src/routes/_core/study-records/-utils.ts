import type { StudyRecordWithReviewsDto } from '@y/interface/study-records/dto/study-record-with-reviews.dto.js';
import { type CalendarDisplayEvent } from './index';

// 类型守卫函数
export function isStudyRecord(
  item: CalendarDisplayEvent,
): item is Omit<StudyRecordWithReviewsDto, 'upcomingReviewsInMonth'> {
  return 'studiedAt' in item && 'courseId' in item && 'textTitle' in item;
}
