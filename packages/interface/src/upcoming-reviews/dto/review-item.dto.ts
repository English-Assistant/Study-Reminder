import { IsString, IsDate, IsNumber } from 'class-validator';

export class ReviewItemDto {
  @IsString()
  studyRecordId!: string;

  @IsString()
  textTitle!: string;

  @IsDate()
  expectedReviewAt!: Date;

  @IsNumber()
  ruleId!: number;

  @IsString()
  ruleDescription!: string | null;
}
