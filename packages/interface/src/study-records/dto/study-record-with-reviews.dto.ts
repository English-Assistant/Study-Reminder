import { StudyRecord } from '@prisma/client';

interface CourseSummaryForDto {
  id: string;
  name: string;
  color?: string | null; // 从 Prisma 同步，可以是 null
  note?: string | null; // 从 Prisma 同步，改为 note
}

export class UpcomingReviewInRecordDto {
  // @ApiProperty({ description: '学习记录ID' })
  studyRecordId: string; // 学习记录ID

  // @ApiProperty({ description: '课程信息' })
  course: CourseSummaryForDto; // 完整的课程信息

  // @ApiProperty({ description: '学习内容标题' })
  textTitle: string; // 学习内容标题

  // @ApiProperty({ description: '预计复习时间' })
  expectedReviewAt: Date; // 预计复习时间

  // @ApiProperty({ description: '复习规则ID' })
  ruleId: string; // 复习规则ID

  // @ApiProperty({ description: '复习规则描述' })
  ruleDescription: string | null; // 复习规则描述
}

export class StudyRecordWithReviewsDto
  implements Omit<StudyRecord, 'course' | 'updatedAt'>
{
  // Omit Prisma的course
  // 从 StudyRecord 继承的属性
  // @ApiProperty({ description: '学习记录ID' })
  id: string; // 学习记录ID

  // @ApiProperty({ description: '用户ID' })
  userId: string; // 用户ID

  // @ApiProperty({ description: '课程ID' })
  courseId: string; // 课程ID

  // @ApiProperty({ description: '学习内容标题' })
  textTitle: string; // 学习内容标题

  // @ApiProperty({ description: '学习笔记', nullable: true })
  note: string | null; // 学习笔记

  // @ApiProperty({ description: '学习时间' })
  studiedAt: Date; // 学习时间

  // @ApiProperty({ description: '创建时间' })
  createdAt: Date; // 创建时间

  // 新增的属性
  // @ApiProperty({
  //   description: '当月待复习列表',
  //   type: [UpcomingReviewInRecordDto],
  // })
  upcomingReviewsInMonth: UpcomingReviewInRecordDto[]; // 当月待复习列表

  // 可选：如果需要直接在结果中包含课程名称
  // @ApiProperty({ description: '课程名称', required: false })
  course?: CourseSummaryForDto | null; // 包含课程的摘要信息
}
