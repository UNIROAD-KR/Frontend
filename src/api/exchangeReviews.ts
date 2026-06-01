import { api } from './client';
import { BaseResponse, PageResponse, Pageable } from './types';

export interface ExchangeReviewResponse {
  id: number;
  title: string;
  content: string;
  country: string;
  type: string;
  authorName: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  tags: string[];
  likedByMe: boolean;
}

export interface ReviewLikeResponse {
  likedByMe: boolean;
  likeCount: number;
}

export interface ReviewCommentResponse {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export const getExchangeReviews = (
  params: { keyword?: string; country?: string; type?: string } & Pageable = { page: 0, size: 20 },
) => {
  return api.get<BaseResponse<PageResponse<ExchangeReviewResponse>>>('/api/exchange-reviews', {
    params,
  });
};

export const getExchangeReview = (id: number) => {
  return api.get<BaseResponse<ExchangeReviewResponse>>(`/api/exchange-reviews/${id}`);
};

export const likeExchangeReview = (id: number) => {
  return api.post<BaseResponse<ReviewLikeResponse>>(`/api/exchange-reviews/${id}/like`);
};

export const unlikeExchangeReview = (id: number) => {
  return api.delete<BaseResponse<ReviewLikeResponse>>(`/api/exchange-reviews/${id}/like`);
};

export const getExchangeReviewComments = (id: number) => {
  return api.get<BaseResponse<ReviewCommentResponse[]>>(`/api/exchange-reviews/${id}/comments`);
};

export const createExchangeReviewComment = (id: number, content: string) => {
  return api.post<BaseResponse<ReviewCommentResponse>>(`/api/exchange-reviews/${id}/comments`, {
    content,
  });
};
