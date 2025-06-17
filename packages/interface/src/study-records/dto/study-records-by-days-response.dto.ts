import type { CourseSummaryDto } from './study-records-by-month-response.dto';
import { StudyRecord } from '@prisma/client';

export type StudyRecordSimpleDto = Omit<StudyRecord, 'course' | 'updatedAt'>;

export interface GroupedStudyRecordsSimpleDto {
  date: string;
  records: StudyRecordSimpleDto[];
}

export interface StudyRecordsByDaysResponseDto {
  courses: CourseSummaryDto[];
  groups: GroupedStudyRecordsSimpleDto[];
}
