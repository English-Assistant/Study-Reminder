// packages/app/src/apis/review-settings.ts
import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { ReviewSettingsModuleController } from '@y/interface/review-settings-module/review-settings-module.controller.ts';

// 导入用作参数的 DTO
import type { SetGlobalReviewRulesDto } from '@y/interface/review-settings-module/dto/set-global-review-rules.dto.ts';
// ReviewRuleDto 将从控制器方法的返回类型中推断出来

// 获取全局复习规则
export async function getGlobalReviewRules() {
  const response =
    await request.get<
      GlobalApiTypes<
        ReturnType<ReviewSettingsModuleController['getGlobalReviewRules']>
      >
    >('/review-settings');
  return response.data.data;
}

// 设置全局复习规则
export async function setGlobalReviewRules(data: SetGlobalReviewRulesDto) {
  const response = await request.post<
    GlobalApiTypes<
      ReturnType<ReviewSettingsModuleController['setGlobalReviewRules']>
    >
  >('/review-settings', data);
  return response.data.data;
}
