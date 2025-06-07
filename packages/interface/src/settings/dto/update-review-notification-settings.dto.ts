import type { ReviewRuleDto } from '../../review-settings/dto/review-rule.dto';

interface NotificationSettings {
  globalNotification: boolean;
  emailNotification: boolean;
  inAppNotification: boolean;
}

export interface UpdateReviewNotificationSettingsDto {
  notificationSettings: NotificationSettings;
  reviewRules: ReviewRuleDto[];
}
