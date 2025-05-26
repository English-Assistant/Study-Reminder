// packages/app/src/apis/user-course-progress.ts
import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { UserCourseProgressModuleController } from '@y/interface/user-course-progress-module/user-course-progress-module.controller.ts';

// 导入用作参数的 DTO (如果存在)
// import type { MarkCourseAsCompletedDto } from '@y/interface/user-course-progress-module/dto/mark-course-as-completed.dto.ts';
// UserCourseCompletionDto 等将从控制器方法的返回类型中推断出来

// 标记课程为已完成
export async function markCourseAsCompleted(
  courseId: string /* data?: MarkCourseAsCompletedDto */,
) {
  // 如果后端控制器 `markCourseAsCompleted` 方法需要请求体，则取消注释 data 参数和对应 DTO
  const response = await request.post<
    GlobalApiTypes<
      ReturnType<UserCourseProgressModuleController['markCourseAsCompleted']>
    >
  >(
    `/user-course-progress/course/${courseId}/complete`,
    // data || {} // 如果有请求体，则传递
  );
  return response.data.data;
}

// 获取用户已完成的课程列表
export async function getCompletedCourses() {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<UserCourseProgressModuleController['getCompletedCourses']>
    >
  >('/user-course-progress/completed');
  return response.data.data;
}

// 获取特定课程的完成状态
export async function getCourseCompletionStatus(courseId: string) {
  const response = await request.get<
    GlobalApiTypes<
      ReturnType<
        UserCourseProgressModuleController['getCourseCompletionStatus']
      >
    >
  >(`/user-course-progress/course/${courseId}/status`);
  return response.data.data;
}
