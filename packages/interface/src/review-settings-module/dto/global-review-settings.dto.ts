import { ReviewRuleDto } from './review-rule.dto';
import { Type } from 'class-transformer';
import { IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GlobalReviewSettingsDto {
  @ApiProperty({ description: '是否启用全局复习设置', example: true })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ description: '是否启用邮件通知', example: true })
  @IsBoolean()
  emailNotifications!: boolean;

  @ApiProperty({ description: '是否启用应用内通知', example: true })
  @IsBoolean()
  appNotifications!: boolean;

  @ApiProperty({ type: () => [ReviewRuleDto], description: '复习规则列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewRuleDto)
  rules!: ReviewRuleDto[];
}
