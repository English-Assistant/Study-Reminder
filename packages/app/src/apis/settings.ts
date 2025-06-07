import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';
import type { SettingsController } from '@y/interface/settings/settings.controller.ts';
import type { UpdateEmailDto } from '@y/interface/settings/dto/update-email.dto.js';
import type { UpdateNotificationFlagsDto } from '@y/interface/settings/dto/update-notification-flags.dto.js';
import type { ReviewRuleDto } from '@y/interface/review-settings/dto/review-rule.dto.js';
import type {
  CreateStudyTimeWindowDto,
  UpdateStudyTimeWindowDto,
} from '@y/interface/settings/dto/study-time-window.dto.js';

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
 * 更新通知开关
 */
export async function updateNotificationFlagsApi(
  data: UpdateNotificationFlagsDto,
) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<SettingsController['updateNotificationFlags']>>
  >('/settings/notification-flags', data);
  return response.data.data;
}

/*
 * 更新提醒规则
 */
export async function updateReviewRulesApi(data: ReviewRuleDto[]) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<SettingsController['updateReviewRules']>>
  >('/settings/review-rules', data);
  return response.data.data;
}

/*
 * 获取所有学习时间段
 */
export async function getStudyTimeWindowsApi() {
  const response = await request.get<
    GlobalApiTypes<ReturnType<SettingsController['getStudyTimeWindows']>>
  >('/settings/study-time-windows');
  return response.data.data;
}

/*
 * 创建新的学习时间段
 */
export async function createStudyTimeWindowApi(data: CreateStudyTimeWindowDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<SettingsController['createStudyTimeWindow']>>
  >('/settings/study-time-windows', data);
  return response.data.data;
}

/*
 * 更新学习时间段
 */
export async function updateStudyTimeWindowApi(
  id: string,
  data: UpdateStudyTimeWindowDto,
) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<SettingsController['updateStudyTimeWindow']>>
  >(`/settings/study-time-windows/${id}`, data);
  return response.data.data;
}

/*
 * 删除学习时间段
 */
export async function deleteStudyTimeWindowApi(id: string) {
  const response = await request.delete<
    GlobalApiTypes<ReturnType<SettingsController['deleteStudyTimeWindow']>>
  >(`/settings/study-time-windows/${id}`);
  return response.data.data;
}
