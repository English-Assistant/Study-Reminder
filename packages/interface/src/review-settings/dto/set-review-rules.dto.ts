import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { InputReviewRuleDto } from './input-review-rule.dto';

export class SetReviewRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InputReviewRuleDto)
  rules!: InputReviewRuleDto[];
}
