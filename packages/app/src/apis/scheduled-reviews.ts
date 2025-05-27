// packages/app/src/apis/scheduled-reviews.ts
import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { ScheduledReviewsModuleController } from '@y/interface/scheduled-reviews-module/scheduled-reviews-module.controller.ts';

// ScheduledReviewDto 将从控制器方法的返回类型中推断出来

// 获取计划复习列表
// 注意：后端支持 from 和 to 日期查询参数，如果前端需要，可以在这里添加
interface GetScheduledReviewsParams {
  from?: string; // ISO date string
  to?: string; // ISO date string
}
export async function getScheduledReviews(params?: GetScheduledReviewsParams) {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<ScheduledReviewsModuleController['getScheduledReviews']>
    >
  >('/scheduled-reviews', { params });
  return response.data.data;
}
