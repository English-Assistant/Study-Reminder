import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';
import type { SettingsController } from '@y/interface/settings/settings.controller.ts';
import type { UpdateEmailDto } from '@y/interface/settings/dto/update-email.dto.js';
import type { UpdateReviewNotificationSettingsDto } from '@y/interface/settings/dto/update-review-notification-settings.dto.js';

/*
 * 获取用户配置
 */
export async function getUserSettingsApi() {
  const response =
    await request.get<
      GlobalApiTypes<ReturnType<SettingsController['getSettings']>>
    >('/settings');
  return response.data.data;
}

/*
 * 更新邮箱
 */
export async function updateEmailApi(data: UpdateEmailDto) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<SettingsController['updateEmail']>>
  >('/settings/email', data);
  return response.data.data;
}

/*
 * 更新通知设置+规则
 */
export async function updateNotificationSettingsApi(
  data: UpdateReviewNotificationSettingsDto,
) {
  const response = await request.patch<
    GlobalApiTypes<
      ReturnType<SettingsController['updateReviewNotificationSettings']>
    >
  >('/settings/review-notifications', data);
  return response.data.data;
}
