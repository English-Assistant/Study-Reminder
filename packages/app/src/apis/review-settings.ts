// packages/app/src/apis/review-settings.ts
import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器 - 用于ReturnType辅助获取类型，实际DTO从下面直接导入
// import type { ReviewSettingsModuleController } from '@y/interface/review-settings-module/review-settings-module.controller'; // 通常 .ts 后缀不需要

// 导入实际使用的 DTO 类型
// 确保在 tsconfig.app.json 中正确配置了 @y/interface 路径别名
import type { ReviewRuleDto } from '@y/interface/review-settings-module/dto/review-rule.dto.ts';
import type { GlobalReviewSettingsDto } from '@y/interface/review-settings-module/dto/global-review-settings.dto.ts';
import type { SetGlobalReviewRulesDto } from '@y/interface/review-settings-module/dto/set-global-review-rules.dto.ts';

// 定义前端期望的API数据结构 (根据方案A)
export interface GlobalReviewSettingsData {
  enabled: boolean;
  rules: ReviewRuleDto[];
  emailNotifications: boolean;
  appNotifications: boolean;
}

// 定义前端发送给 setGlobalReviewRules API 的数据结构 (根据方案A)
// 注意: 这应该与后端期望的 SetGlobalReviewRulesDto 一致或兼容
// 如果后端 SetGlobalReviewRulesDto 只包含 rules，那么这个前端类型代表了一个理想情况
// 我们将假设后端 SetGlobalReviewRulesDto 已更新为包含以下所有字段
export interface FrontendSetGlobalReviewRulesPayload {
  enabled: boolean;
  rules: ReviewRuleDto[];
  emailNotifications: boolean;
  appNotifications: boolean;
}

// 获取全局复习设置
export async function getGlobalSettings(): Promise<GlobalReviewSettingsDto> {
  const response =
    await request.get<GlobalApiTypes<GlobalReviewSettingsDto>>(
      '/review-settings',
    );
  return response.data.data;
}

// 设置全局复习设置
export async function setGlobalSettings(
  data: Partial<SetGlobalReviewRulesDto>, // 使用 Partial 因为后端 DTO 字段是可选的
): Promise<GlobalReviewSettingsDto> {
  const response = await request.post<GlobalApiTypes<GlobalReviewSettingsDto>>(
    '/review-settings',
    data,
  );
  return response.data.data;
}
