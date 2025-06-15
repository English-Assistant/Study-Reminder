import { StudyRecord } from '@prisma/client';

interface CourseSummaryForDto {
  id: string;
  name: string;
  color?: string | null; // 从 Prisma 同步，可以是 null
  note?: string | null; // 从 Prisma 同步，改为 note
}

export class UpcomingReviewInRecordDto {
  studyRecordId: string; // 学习记录ID
  course: CourseSummaryForDto; // 完整的课程信息
  textTitle: string; // 学习内容标题
  expectedReviewAt: Date; // 预计复习时间
  ruleId: number; // 复习规则ID
  ruleDescription: string | null; // 复习规则描述
}

export class StudyRecordWithReviewsDto
  implements Omit<StudyRecord, 'course' | 'updatedAt'>
{
  // Omit Prisma的course
  // 从 StudyRecord 继承的属性
  id: string; // 学习记录ID
  userId: string; // 用户ID
  courseId: string; // 课程ID
  textTitle: string; // 学习内容标题
  note: string | null; // 学习笔记
  studiedAt: Date; // 学习时间
  createdAt: Date; // 创建时间

  // 新增的属性
  upcomingReviewsInMonth: UpcomingReviewInRecordDto[]; // 当月待复习列表

  // 可选：如果需要直接在结果中包含课程名称
  course?: CourseSummaryForDto | null; // 包含课程的摘要信息
}
