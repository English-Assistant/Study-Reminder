import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// Backend DTOs and Controller types
import type { StudyRecordsController } from '@y/interface/study-records/study-records.controller.ts';
import type { CreateStudyRecordDto } from '@y/interface/study-records/dto/create-study-record.dto.ts';
import type { UpdateStudyRecordDto } from '@y/interface/study-records/dto/update-study-record.dto.ts';
import type { StudyRecord } from '@y/interface/common/prisma.type.ts'; // Assuming @prisma/client types are accessible
import type { GetStudyRecordsDto } from '@y/interface/study-records/dto/get-study-records.dto.js';
import type { GetStudyRecordsByMonthQueryDto } from '@y/interface/study-records/dto/get-study-records-by-month-query.dto.ts';
import type { StudyRecordWithReviewsDto } from '@y/interface/study-records/dto/study-record-with-reviews.dto.ts';

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
export async function getAllStudyRecordsApi(params?: GetStudyRecordsDto) {
  const response = await request.get<
    GlobalApiTypes<ReturnType<StudyRecordsController['findAll']>>
  >('/study-records', { params });
  return response.data.data;
}

/**
 * 获取学习记录总数
 */
export async function getStudyRecordsCountApi() {
  const response = await request.get<
    GlobalApiTypes<ReturnType<StudyRecordsController['countAll']>>
  >('/study-records/count');
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

/**
 * 根据月份获取学习记录及当月待复习项
 */
export async function getStudyRecordsByMonthApi(
  params: GetStudyRecordsByMonthQueryDto,
): Promise<StudyRecordWithReviewsDto[]> {
  const response = await request.get<
    GlobalApiTypes<ReturnType<StudyRecordsController['getByMonth']>>
  >('/study-records/by-month', { params });
  return response.data.data;
}

/*
 * 获取连续学习天数
 */
export async function getConsecutiveDaysApi() {
  const response = await request.get<
    GlobalApiTypes<ReturnType<StudyRecordsController['getConsecutiveDays']>>
  >('/study-records/consecutive-days');
  return response.data.data;
}
