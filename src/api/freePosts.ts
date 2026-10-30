import { api } from "./client";
import { BaseResponse, CursorRequest, CursorResponse } from "./types";
export type FreePostStatusFilter = "전체" | "고민글" | "사담글" | "질문글";
export const FreePostCategoryMap = {
  질문글: "QUESTION",
  사담글: "CHAT",
  고민글: "WORRY",
} as const;
export type FreePostCategory =
  (typeof FreePostCategoryMap)[keyof typeof FreePostCategoryMap];

export interface FreePostRequest {
  category?: FreePostCategory;
  title: string;
  content: string;
  imageUrls?: string[];
}

export interface FreePostSummaryResponse {
  id: number;
  title: string;
  preview: string;
  country: string;
  status: string;
  category: string;
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
  authorId?: number;
  memberId?: number;
  content: string;
  createdAt: string;
  mine?: boolean;
  parentId?: number | null;
  deleted?: boolean;
  replies?: FreePostCommentResponse[];
}

export interface FreePostDetailResponse {
  id: number;
  title: string;
  content: string;
  country: string;
  status: string;
  category: string;
  authorName: string;
  authorNickname?: string;
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

const freePostListEndpointMap: Record<FreePostStatusFilter, string> = {
  전체: "/api/community/free-posts?sort=LATEST&size=10",
  질문글: "/api/community/free-posts?category=QUESTION&sort=LATEST&size=10",
  사담글: "/api/community/free-posts?category=CHAT&sort=LATEST&size=10",
  고민글: "/api/community/free-posts?category=WORRY&sort=LATEST&size=10",
};

export const getFreePosts = async (
  params: CursorRequest = { size: 10 },
  statusFilter: FreePostStatusFilter,
) => {
  const endpoints = freePostListEndpointMap[statusFilter];
  let lastError: unknown = null;

  try {
    const response = await api.get<
      BaseResponse<CursorResponse<FreePostSummaryResponse>>
    >(endpoints, { params });
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    lastError = error;

    if (error.response?.status !== 404) {
      throw error;
    }
  }

  throw lastError;
};

export const getMyFreePosts = (params: CursorRequest = { size: 20 }) => {
  return api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
    "/api/community/free-posts/my",
    { params },
  );
};

export const getLikedFreePosts = (params: CursorRequest = { size: 20 }) => {
  return api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
    "/api/community/free-posts/liked",
    { params },
  );
};

export const getScrappedFreePosts = (params: CursorRequest = { size: 20 }) => {
  return api.get<BaseResponse<CursorResponse<FreePostSummaryResponse>>>(
    "/api/community/free-posts/scraps",
    { params },
  );
};

export const createFreePost = (data: FreePostRequest) => {
  return api.post<BaseResponse<number>>("/api/community/free-posts", data);
};

export const getFreePostDetail = (postId: number) => {
  return api.get<BaseResponse<FreePostDetailResponse>>(
    `/api/community/free-posts/${postId}`,
  );
};

export const updateFreePost = (postId: number, data: FreePostRequest) => {
  return api.put<BaseResponse<void>>(
    `/api/community/free-posts/${postId}`,
    data,
  );
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

export const createFreePostComment = (
  postId: number,
  content: string,
  parentId?: number,
) => {
  return api.post<BaseResponse<FreePostCommentResponse>>(
    `/api/community/free-posts/${postId}/comments`,
    parentId ? { content, parentId } : { content },
  );
};

export const deleteFreePostComment = (postId: number, commentId: number) => {
  return api.delete<BaseResponse<void>>(
    `/api/community/free-posts/${postId}/comments/${commentId}`,
  );
};
