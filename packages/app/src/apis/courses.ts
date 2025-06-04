import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// Backend DTOs, Controller, and Prisma types
import type { CoursesController } from '@y/interface/courses/courses.controller.ts';
import type { CreateCourseDto } from '@y/interface/courses/dto/create-course.dto.ts';
import type { UpdateCourseDto } from '@y/interface/courses/dto/update-course.dto.ts';

// --- API Functions ---

/**
 * 创建新课程
 */
export async function createCourseApi(data: CreateCourseDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<CoursesController['create']>>
  >('/courses', data);
  return response.data.data;
}

/**
 * 获取当前用户的所有课程
 */
export async function getAllCoursesApi() {
  const response =
    await request.get<GlobalApiTypes<ReturnType<CoursesController['findAll']>>>(
      '/courses',
    );
  return response.data.data;
}

/**
 * 更新课程
 */
export async function updateCourseApi(id: string, data: UpdateCourseDto) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<CoursesController['update']>>
  >(`/courses/${id}`, data);
  return response.data.data;
}

/**
 * 删除课程
 */
export async function deleteCourseApi(id: string) {
  await request.delete<GlobalApiTypes<void>>(`/courses/${id}`);
  return '删除成功';
}
