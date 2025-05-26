// packages/app/src/apis/learning-activities.ts
import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { LearningActivitiesModuleController } from '@y/interface/learning-activities-module/learning-activities-module.controller.ts';

// 导入用作参数的 DTO
import type { CreateLearningActivityDto } from '@y/interface/learning-activities-module/dto/create-learning-activity.dto.ts';
// LearningActivity DTO 将从控制器方法的返回类型中推断出来

// 创建新的学习活动
export async function createLearningActivity(data: CreateLearningActivityDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<LearningActivitiesModuleController['create']>>
  >('/learning-activities', data);
  return response.data.data;
}

// 根据课程 ID 获取学习活动
export async function getLearningActivitiesByCourse(courseId: string) {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<LearningActivitiesModuleController['findAllByCourse']>
    >
  >(`/learning-activities/course/${courseId}`);
  return response.data.data;
}

// 获取当前用户的所有学习活动
export async function getLearningActivitiesByUser() {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<LearningActivitiesModuleController['findAllByUser']>
    >
  >('/learning-activities/user');
  return response.data.data;
}

// 根据 ID 获取特定的学习活动
export async function getLearningActivityById(id: string) {
  const response = await request.get<
    GlobalApiTypes<ReturnType<LearningActivitiesModuleController['findOne']>>
  >(`/learning-activities/${id}`);
  return response.data.data;
}
