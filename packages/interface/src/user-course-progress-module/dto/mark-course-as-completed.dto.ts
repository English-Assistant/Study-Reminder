import { IsNotEmpty, IsUUID } from 'class-validator';

export class MarkCourseAsCompletedDto {
  @IsUUID('4', { message: '课程ID必须是有效的UUID' })
  @IsNotEmpty({ message: '课程ID不能为空' })
  courseId!: string;
}
