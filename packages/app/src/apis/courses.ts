import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { CoursesModuleController } from '@y/interface/courses-module/courses-module.controller.ts';

// 导入用作参数的 DTO
import type { CreateCourseDto } from '@y/interface/courses-module/dto/create-course.dto.ts';
import type { UpdateCourseDto } from '@y/interface/courses-module/dto/update-course.dto.ts';

// 创建新课程
export async function createCourse(data: CreateCourseDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<CoursesModuleController['create']>>
  >('/courses', data);
  return response.data.data;
}

// 获取当前用户的所有课程
export async function getAllCourses() {
  const response =
    await request.get<
      GlobalApiTypes<ReturnType<CoursesModuleController['findAll']>>
    >('/courses');
  return response.data.data;
}

// 根据 ID 获取特定课程
export async function getCourseById(id: string) {
  const response = await request.get<
    GlobalApiTypes<ReturnType<CoursesModuleController['findOne']>>
  >(`/courses/${id}`);
  return response.data.data;
}

// 更新课程
export async function updateCourse(id: string, data: UpdateCourseDto) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<CoursesModuleController['update']>>
  >(`/courses/${id}`, data);
  return response.data.data;
}

// 删除课程
export async function deleteCourse(id: string) {
  await request.delete<
    GlobalApiTypes<ReturnType<CoursesModuleController['remove']>>
  >(`/courses/${id}`);
}
