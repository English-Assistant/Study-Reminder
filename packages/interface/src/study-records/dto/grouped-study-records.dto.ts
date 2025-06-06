class CourseForStudyRecordDto {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  note: string | null;
  createdAt: Date;
}

class StudyRecordForGroupingDto {
  id: string;
  userId: string;
  courseId: string;
  studiedAt: Date;
  textTitle: string;
  note: string | null;
  createdAt: Date;
  course: CourseForStudyRecordDto;
}

export class GroupedStudyRecordsDto {
  date: string;
  records: StudyRecordForGroupingDto[];
}
