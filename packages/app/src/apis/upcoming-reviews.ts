import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// Backend DTOs and Controller types
import type { UpcomingReviewsController } from '@y/interface/upcoming-reviews/upcoming-reviews.controller.ts';
import type { GetUpcomingReviewsDto } from '@y/interface/upcoming-reviews/dto/get-upcoming-reviews.dto.js';
import type { UpcomingReviewsResponseDto } from '@y/interface/upcoming-reviews/dto/upcoming-reviews-response.dto.ts';

/**
 * 获取即将复习的记录
 */
export async function getUpcomingReviewsApi(
  params?: GetUpcomingReviewsDto,
): Promise<UpcomingReviewsResponseDto> {
  const response = await request.get<
    GlobalApiTypes<ReturnType<UpcomingReviewsController['getUpcomingReviews']>>
  >('/upcoming-reviews', { params });
  return response.data.data;
}
