import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { LearningActivityType } from '../../../generated/prisma'; // 调整路径

export class CreateLearningActivityDto {
  @IsString({ message: '课程ID必须是字符串' })
  @IsNotEmpty({ message: '课程ID不能为空' })
  @IsUUID('4', { message: '课程ID必须是有效的UUID' })
  courseId!: string;

  @IsEnum(LearningActivityType, { message: '无效的活动类型' })
  @IsNotEmpty({ message: '活动类型不能为空' })
  activityType!: LearningActivityType;

  @IsString({ message: '备注必须是字符串' })
  @IsOptional()
  notes?: string;

  // userId will be taken from the authenticated user
  // activityTimestamp will be set by the server, defaults to now()
}
