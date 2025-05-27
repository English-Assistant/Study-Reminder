import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  Matches,
} from 'class-validator';

export class ManualReviewEntryDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  courseId!: string;

  @IsString()
  @IsOptional()
  courseName?: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  reviewDate!: string; // YYYY-MM-DD from reviewDate DateTime field

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'reviewTime 必须是有效的 HH:mm 格式',
  })
  reviewTime?: string;

  @IsDateString()
  createdAt!: string;

  @IsDateString()
  updatedAt!: string;
}
