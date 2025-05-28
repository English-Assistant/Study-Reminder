import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// Backend DTOs and Controller types
import type { UpcomingReviewsController } from '@y/interface/upcoming-reviews/upcoming-reviews.controller.ts';
import type { UpcomingReviewDto } from '@y/interface/upcoming-reviews/dto/upcoming-review.dto.ts';

// --- DTOs and Response Interfaces (defined locally) ---

// Corresponds to backend UpcomingReviewDto
export interface UpcomingReviewDto {
  studyRecordId: string;
  textTitle: string;
  courseId: string;
  courseName: string;
  expectedReviewAt: string; // Or Date, ISO8601 date-time string
  ruleId: string;
  ruleDescription: string;
}

interface GetUpcomingReviewsParams {
  withinDays?: number;
}

// --- API Functions ---

/**
 * 获取即将复习的记录
 */
export async function getUpcomingReviewsApi(
  params?: GetUpcomingReviewsParams,
): Promise<UpcomingReviewDto[]> {
  const response = await request.get<
    GlobalApiTypes<ReturnType<UpcomingReviewsController['getUpcomingReviews']>>
  >('/upcoming-reviews', { params });
  return response.data.data;
}
