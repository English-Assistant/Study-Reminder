import { IsString, IsDate } from 'class-validator';

export class ReviewItemDto {
  @IsString()
  studyRecordId!: string;

  @IsString()
  textTitle!: string;

  @IsDate()
  expectedReviewAt!: Date;

  @IsString()
  ruleId!: string;

  @IsString()
  ruleDescription!: string | null;
}
