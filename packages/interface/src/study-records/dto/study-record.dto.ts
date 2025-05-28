import { IsString, IsDate, IsOptional, IsUUID } from 'class-validator';

export class StudyRecordDto {
  @IsUUID('4')
  id!: string;

  @IsUUID('4')
  userId!: string;

  @IsUUID('4')
  courseId!: string;

  @IsDate()
  studiedAt!: Date;

  @IsString()
  textTitle!: string;

  @IsOptional()
  @IsString()
  note: string | null;

  @IsDate()
  createdAt!: Date;

  // Prisma Client 的 StudyRecord 类型不直接包含 User 或 Course 对象，
  // 如果需要在响应中包含它们，通常是通过 service 层进行关联查询并映射到 DTO。
  // 这里保持 DTO 与 Prisma 模型的基础字段一致。
}
