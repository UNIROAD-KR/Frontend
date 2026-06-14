import { api } from './client';
import { BaseResponse, CursorRequest, CursorResponse } from './types';

export interface FreePostRequest {
  title: string;
  content: string;
  country: string;
  status: string;
  imageUrls?: string[];
}

export interface FreePostSummaryResponse {
  id: number;
  title: string;
  preview: string;
  country: string;
  status: string;
  authorName: string;
  likeCount: number;
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

export const getFreePosts = (params: CursorRequest = { size: 10 }) => {
  return api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
    '/api/community/free-posts',
    { params },
  );
};

export const getMyFreePosts = (params: CursorRequest = { size: 20 }) => {
  return api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
    '/api/community/free-posts/my',
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
