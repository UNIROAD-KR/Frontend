import { api } from './client';
import { BaseResponse, PageResponse, Pageable } from './types';

export interface ReviewSummaryResponse {
  id: number;
  title: string;
  summary: string;
  rating: number;
  authorNickname: string;
  createdAt: string;
}

export const getReviews = (
  params: { partnerUniversityId?: number; country?: string } & Pageable = { page: 0, size: 20 },
) => {
  return api.get<BaseResponse<PageResponse<ReviewSummaryResponse>>>('/api/reviews', {
    params,
  });
};
