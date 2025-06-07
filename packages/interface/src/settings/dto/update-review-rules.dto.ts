import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewRuleDto } from '../../review-settings/dto/review-rule.dto';

export class UpdateReviewRulesDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReviewRuleDto)
  reviewRules: ReviewRuleDto[];
}
