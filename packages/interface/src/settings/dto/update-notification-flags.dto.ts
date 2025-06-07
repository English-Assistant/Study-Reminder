import { IsBoolean } from 'class-validator';

export class UpdateNotificationFlagsDto {
  @IsBoolean()
  globalNotification: boolean;

  @IsBoolean()
  emailNotification: boolean;

  @IsBoolean()
  inAppNotification: boolean;
}
