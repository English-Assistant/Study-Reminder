import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean({ message: '全局通知必须是布尔值' })
  globalNotification?: boolean;

  @IsOptional()
  @IsBoolean({ message: '邮箱通知必须是布尔值' })
  emailNotification?: boolean;

  @IsOptional()
  @IsBoolean({ message: '站内通知必须是布尔值' })
  inAppNotification?: boolean;
}
