import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ReviewRuleDto } from './review-rule.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetGlobalReviewRulesDto {
  @ApiPropertyOptional({
    description: '是否启用全局复习设置 (不传则不修改)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: '是否启用邮件通知 (不传则不修改)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: '是否启用应用内通知 (不传则不修改)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  appNotifications?: boolean;

  @ApiProperty({ type: () => [ReviewRuleDto], description: '复习规则列表' })
  @IsArray({ message: '规则列表必须是一个数组' })
  @ValidateNested({ each: true, message: '每条规则都必须符合格式' })
  @Type(() => ReviewRuleDto)
  rules!: ReviewRuleDto[];
}
