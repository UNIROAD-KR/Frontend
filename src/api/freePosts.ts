import { api } from './client';
import { BaseResponse, CursorRequest, CursorResponse } from './types';

export interface FreePostRequest {
  title: string;
  content: string;
  imageUrls?: string[];
}

export type FreePostStatusFilter = '전체' | '파견 전' | '파견 중';

export interface FreePostSummaryResponse {
  id: number;
  title: string;
  preview: string;
  country: string;
  status: string;
  authorName: string;
  likeCount: number;
  scrapCount?: number;
  commentCount: number;
  thumbnailImageUrl?: string;
  createdAt: string;
}

export interface FreePostCommentResponse {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  mine?: boolean;
}

export interface FreePostDetailResponse {
  id: number;
  title: string;
  content: string;
  country: string;
  status: string;
  authorName: string;
  imageUrls?: string[];
  likeCount: number;
  scrapCount?: number;
  commentCount: number;
  liked: boolean;
  mine: boolean;
  createdAt: string;
  comments?: FreePostCommentResponse[];
}

export interface FreePostLikeResponse {
  liked: boolean;
  likeCount: number;
}

const freePostListEndpointMap: Record<FreePostStatusFilter, string[]> = {
  전체: ['/api/community/free-posts/all', '/api/community/free-posts'],
  '파견 전': [
    '/api/community/free-posts/pre-dispatch',
    '/api/community/free-posts/before-dispatch',
  ],
  '파견 중': [
    '/api/community/free-posts/dispatching',
    '/api/community/free-posts/dispatched',
  ],
};

export const getFreePosts = async (
  params: CursorRequest = { size: 10 },
  statusFilter: FreePostStatusFilter = '전체',
) => {
  const endpoints = freePostListEndpointMap[statusFilter];
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      return await api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
        endpoint,
        { params },
      );
    } catch (error: any) {
      lastError = error;

      if (error.response?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const getMyFreePosts = (params: CursorRequest = { size: 20 }) => {
  return api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
    '/api/community/free-posts/my',
    { params },
  );
};

export const getLikedFreePosts = (params: CursorRequest = { size: 20 }) => {
  return api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
    '/api/community/free-posts/liked',
    { params },
  );
};

export const getScrappedFreePosts = (params: CursorRequest = { size: 20 }) => {
  return api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
    '/api/community/free-posts/scraps',
    { params },
  );
};

export const createFreePost = (data: FreePostRequest) => {
  return api.post<BaseResponse<number>>('/api/community/free-posts', data);
};

export const getFreePostDetail = (postId: number) => {
  return api.get<BaseResponse<FreePostDetailResponse>>(
    `/api/community/free-posts/${postId}`,
  );
};

export const updateFreePost = (postId: number, data: FreePostRequest) => {
  return api.put<BaseResponse<void>>(`/api/community/free-posts/${postId}`, data);
};

export const deleteFreePost = (postId: number) => {
  return api.delete<BaseResponse<void>>(`/api/community/free-posts/${postId}`);
};

export const toggleFreePostLike = (postId: number) => {
  return api.post<BaseResponse<FreePostLikeResponse>>(
    `/api/community/free-posts/${postId}/like`,
  );
};

export const toggleFreePostScrap = (postId: number) => {
  return api.post<BaseResponse<boolean>>(
    `/api/community/free-posts/${postId}/scrap`,
  );
};

export const createFreePostComment = (postId: number, content: string) => {
  return api.post<BaseResponse<FreePostCommentResponse>>(
    `/api/community/free-posts/${postId}/comments`,
    { content },
  );
};

export const deleteFreePostComment = (postId: number, commentId: number) => {
  return api.delete<BaseResponse<void>>(
    `/api/community/free-posts/${postId}/comments/${commentId}`,
  );
};
