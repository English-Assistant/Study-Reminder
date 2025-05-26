// packages/app/src/apis/user-statistics.ts
import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { UserStatisticsModuleController } from '@y/interface/user-statistics-module/user-statistics-module.controller.ts';

// DTOs 将从控制器方法的返回类型中推断出来

// 获取用户总体统计数据
export async function getOverallStats() {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<UserStatisticsModuleController['getOverallStats']>
    >
  >('/user-statistics/overall');
  return response.data.data;
}

// 获取用户活动连续天数
export async function getActivityStreak() {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<UserStatisticsModuleController['getActivityStreak']>
    >
  >('/user-statistics/streak');
  return response.data.data;
}

// 获取每日复习活动 (可带查询参数)
interface GetReviewActivityParams {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  // 其他可能的查询参数，根据后端控制器的 @Query() 定义
}
export async function getReviewActivity(params?: GetReviewActivityParams) {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<UserStatisticsModuleController['getReviewActivity']>
    >
  >('/user-statistics/review-activity', { params });
  return response.data.data;
}

// 获取课程专注度统计
export async function getCourseFocusStats() {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<UserStatisticsModuleController['getCourseFocusStats']>
    >
  >('/user-statistics/course-focus');
  return response.data.data;
}
