import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

import type { ReviewSettingsController } from '@y/interface/review-settings/review-settings.controller.ts';
import type { SetReviewRulesDto } from '@y/interface/review-settings/dto/set-review-rules.dto.ts';

// 获取全局复习设置
export async function getGlobalSettings() {
  const response =
    await request.get<
      GlobalApiTypes<ReturnType<ReviewSettingsController['getReviewRules']>>
    >('/review-settings');
  return response.data.data;
}

// 设置全局复习设置
export async function setGlobalSettings(
  data: Partial<SetReviewRulesDto>, // 使用 Partial 因为后端 DTO 字段是可选的
) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<ReviewSettingsController['setReviewRules']>>
  >('/review-settings', data);
  return response.data.data;
}

/**
 * 获取当前用户的复习规则列表
 */
export async function getReviewRulesApi() {
  const response = await request.get<
    // Assuming the controller method 'getReviewRules' returns ReviewRuleDto[]
    GlobalApiTypes<ReturnType<ReviewSettingsController['getReviewRules']>>
  >('/review-settings');
  return response.data.data;
}

/**
 * 批量设置当前用户的复习规则
 * @param data 包含规则列表的 DTO，应符合 backend SetReviewRulesDto
 */
export async function setReviewRulesApi(data: SetReviewRulesDto) {
  const response = await request.post<
    // Assuming the controller method 'setReviewRules' returns ReviewRuleDto[]
    GlobalApiTypes<ReturnType<ReviewSettingsController['setReviewRules']>>
  >('/review-settings/set', data);
  return response.data.data;
}
