import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// Backend DTOs and Controller types
import type { StudyRecordsController } from '@y/interface/study-records/study-records.controller.ts';
import type { CreateStudyRecordDto } from '@y/interface/study-records/dto/create-study-record.dto.ts';
import type { UpdateStudyRecordDto } from '@y/interface/study-records/dto/update-study-record.dto.ts';
import type { StudyRecord } from '@prisma/client'; // Assuming @prisma/client types are accessible

/**
 * 创建学习记录
 */
export async function createStudyRecordApi(
  data: CreateStudyRecordDto,
): Promise<StudyRecord> {
  const response = await request.post<
    GlobalApiTypes<ReturnType<StudyRecordsController['create']>>
  >('/study-records', data);
  return response.data.data;
}

/**
 * 获取学习记录列表
 */
export async function getAllStudyRecordsApi(
  params?: FindAllParams,
): Promise<StudyRecord[]> {
  const response = await request.get<
    GlobalApiTypes<ReturnType<StudyRecordsController['findAll']>>
  >('/study-records', { params });
  return response.data.data;
}

/**
 * 根据 ID 获取特定学习记录
 */
export async function getStudyRecordByIdApi(id: string) {
  const response = await request.get<
    GlobalApiTypes<ReturnType<StudyRecordsController['findOne']>>
  >(`/study-records/${id}`);
  return response.data.data;
}

/**
 * 更新学习记录
 */
export async function updateStudyRecordApi(
  id: string,
  data: UpdateStudyRecordDto,
) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<StudyRecordsController['update']>>
  >(`/study-records/${id}`, data);
  return response.data.data;
}

/**
 * 删除学习记录
 */
export async function deleteStudyRecordApi(id: string) {
  await request.delete<GlobalApiTypes<void>>(`/study-records/${id}`);
  return '删除成功';
}
