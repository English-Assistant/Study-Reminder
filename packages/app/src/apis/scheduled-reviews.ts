// packages/app/src/apis/scheduled-reviews.ts
import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { ScheduledReviewsModuleController } from '@y/interface/scheduled-reviews-module/scheduled-reviews-module.controller.ts';

// 导入用作参数的 DTO
import type { MarkReviewAsDoneDto } from '@y/interface/scheduled-reviews-module/dto/mark-review-as-done.dto.ts';
// ScheduledReviewDto 将从控制器方法的返回类型中推断出来

// 获取计划复习列表
export async function getScheduledReviews() {
  const response =
    await request.get<
      GlobalApiTypes<
        ReturnType<ScheduledReviewsModuleController['getScheduledReviews']>
      >
    >('/scheduled-reviews');
  return response.data.data;
}

// 标记复习项为已完成
export async function markReviewAsDone(data: MarkReviewAsDoneDto) {
  const response = await request.post<
    GlobalApiTypes<
      ReturnType<ScheduledReviewsModuleController['markReviewAsDone']>
    >
  >('/scheduled-reviews/mark-done', data);
  return response.data.data;
}
