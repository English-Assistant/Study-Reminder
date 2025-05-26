import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ReviewRuleDto } from './review-rule.dto';

export class SetGlobalReviewRulesDto {
  @IsArray({ message: '规则列表必须是一个数组' })
  @ValidateNested({ each: true, message: '每条规则都必须符合格式' })
  @Type(() => ReviewRuleDto)
  rules!: ReviewRuleDto[];
}
