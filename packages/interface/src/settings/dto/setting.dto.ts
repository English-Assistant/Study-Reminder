import { Type } from 'class-transformer';
import { IsEmail, IsArray, ValidateNested, IsDefined } from 'class-validator';
import { ReviewRuleDto } from '../../review-settings/dto/review-rule.dto'; // 假设 ReviewRuleDto 在此路径
import { UpdateSettingsDto } from './update-review-notification-settings.dto';

export class SettingDto {
  @IsEmail()
  @IsDefined()
  email: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewRuleDto)
  @IsDefined()
  reviewRules: ReviewRuleDto[];

  @ValidateNested()
  @Type(() => UpdateSettingsDto)
  @IsDefined()
  notificationSettings: UpdateSettingsDto;
}
