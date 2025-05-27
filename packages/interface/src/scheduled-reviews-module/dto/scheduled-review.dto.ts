import {
  IsString,
  IsDateString,
  IsUUID,
  IsOptional,
  Matches,
  IsIn,
} from 'class-validator';

export type ScheduledReviewItemType = 'manual' | 'rule-based';

export class ScheduledReviewDto {
  @IsString()
  id!: string;

  @IsUUID()
  courseId!: string;

  @IsString()
  courseName!: string;

  @IsString({ message: '颜色值必须是字符串' })
  @IsOptional()
  @Matches(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, {
    message: '颜色值必须是有效的十六进制颜色代码 (例如 #RRGGBB 或 #RGB)',
  })
  courseColor?: string;

  @IsDateString()
  scheduledAt!: string;

  @IsUUID()
  @IsOptional()
  reviewRuleId?: string;

  @IsString()
  @IsOptional()
  ruleDescription?: string;

  @IsOptional()
  repetitionCycle?: number;

  @IsIn(['manual', 'rule-based'])
  type!: ScheduledReviewItemType;
}
