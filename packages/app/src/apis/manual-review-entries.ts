// packages/app/src/apis/manual-review-entries.ts
import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { ManualReviewEntriesModuleController } from '@y/interface/manual-review-entries-module/manual-review-entries-module.controller.ts';

// 导入用作参数的 DTO
import type { CreateManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/create-manual-review-entry.dto.ts';
import type { UpdateManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/update-manual-review-entry.dto.ts';
// ManualReviewEntryDto 将从控制器方法的返回类型中推断出来

// 创建手动复习条目
export async function createManualReviewEntry(
  data: CreateManualReviewEntryDto,
) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<ManualReviewEntriesModuleController['create']>>
  >('/manual-review-entries', data);
  return response.data.data;
}

// 获取所有手动复习条目 (可带查询参数)
interface FindAllManualReviewEntriesParams {
  courseId?: string;
  completed?: boolean;
  // 其他可能的查询参数，根据后端控制器的 @Query() 定义
}
export async function getAllManualReviewEntries(
  params?: FindAllManualReviewEntriesParams,
) {
  const response = await request.get<
    GlobalApiTypes<ReturnType<ManualReviewEntriesModuleController['findAll']>>
  >('/manual-review-entries', { params });
  return response.data.data;
}

// 根据 ID 获取特定的手动复习条目
export async function getManualReviewEntryById(id: string) {
  const response = await request.get<
    GlobalApiTypes<ReturnType<ManualReviewEntriesModuleController['findOne']>>
  >(`/manual-review-entries/${id}`);
  return response.data.data;
}

// 更新手动复习条目
export async function updateManualReviewEntry(
  id: string,
  data: UpdateManualReviewEntryDto,
) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<ManualReviewEntriesModuleController['update']>>
  >(`/manual-review-entries/${id}`, data);
  return response.data.data;
}

// 删除手动复习条目
export async function deleteManualReviewEntry(id: string) {
  await request.delete<
    GlobalApiTypes<ReturnType<ManualReviewEntriesModuleController['remove']>>
  >(`/manual-review-entries/${id}`);
}

// 标记手动复习条目为已完成
export async function markManualEntryAsCompleted(id: string) {
  const response = await request.patch<
    GlobalApiTypes<
      ReturnType<ManualReviewEntriesModuleController['markAsCompleted']>
    >
  >(`/manual-review-entries/${id}/complete`);
  return response.data.data;
}

// 标记手动复习条目为未完成
export async function markManualEntryAsNotCompleted(id: string) {
  const response = await request.patch<
    GlobalApiTypes<
      ReturnType<ManualReviewEntriesModuleController['markAsNotCompleted']>
    >
  >(`/manual-review-entries/${id}/uncomplete`);
  return response.data.data;
}
