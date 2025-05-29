import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { InputReviewRuleDto } from '../../review-settings/dto/input-review-rule.dto';
import { UpdateSettingsDto } from 'src/auth/dto/update-settings.dto';

export class UpdateReviewNotificationSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InputReviewRuleDto)
  reviewRules: InputReviewRuleDto[];

  @ValidateNested()
  @Type(() => UpdateSettingsDto)
  notificationSettings: UpdateSettingsDto;
}

export { UpdateSettingsDto };
