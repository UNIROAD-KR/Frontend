import { api } from './client';
import { BaseResponse, CursorRequest, CursorResponse } from './types';

export interface CompanionPostRequest {
  title: string;
  content: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  country: string;
  region: string;
  chatLink: string;
  status: 'RECRUITING' | 'COMPLETED';
  capacity: number;
  currentParticipants: number;
  genderRatio?: string;
}

export interface CompanionPostResponse {
  id: number;
  memberName: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  country: string;
  region: string;
  chatLink: string;
  status: 'RECRUITING' | 'COMPLETED';
  statusDescription?: string;
  scrapCount?: number;
  capacity: number;
  currentParticipants: number;
  genderRatio?: string;
  createdAt: string;
}

export interface CompanionPostListResponse {
  items: CompanionPostResponse[];
  hasNext: boolean;
  nextCursorId: number | null;
}

// 동행 구하기 목록 조회
export const getCompanionPosts = async (params: CursorRequest = { size: 10 }) => {
  console.log('[동행 구하기 목록 조회 API] 요청 시작: GET /api/companions', params);

  try {
    const response = await api.get<BaseResponse<CursorResponse<CompanionPostResponse>>>(
      '/api/companions',
      { params },
    );
    console.log('[동행 구하기 목록 조회 API] 응답:', response.data);
    console.log(
      '[동행 구하기 목록 조회 API] 게시글 수:',
      response.data.data?.items?.length ?? 0,
    );

    return response;
  } catch (error: any) {
    console.log(
      '[동행 구하기 목록 조회 API] 실패:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// 동행 구하기 게시글 작성
export const createCompanionPost = (data: CompanionPostRequest) => {
  return api.post<BaseResponse<number>>('/api/companions', data);
};

// 동행 구하기 상세 조회
export const getCompanionPostDetail = (postId: number) => {
  return api.get<BaseResponse<CompanionPostResponse>>(`/api/companions/${postId}`);
};

// 동행 구하기 게시글 수정
export const updateCompanionPost = (postId: number, data: CompanionPostRequest) => {
  return api.put<BaseResponse<void>>(`/api/companions/${postId}`, data);
};

// 동행 구하기 게시글 삭제
export const deleteCompanionPost = (postId: number) => {
  return api.delete<BaseResponse<void>>(`/api/companions/${postId}`);
};

// 내 동행 구하기 글 조회
export const getMyCompanionPosts = () => {
  return api.get<BaseResponse<CompanionPostResponse[]>>('/api/companions/my');
};

export const getMyCompanionPostPage = (
  params: CursorRequest = { size: 20 },
) => {
  return api.get<BaseResponse<CompanionPostListResponse>>(
    '/api/companions/my',
    { params },
  );
};

export const getScrappedCompanionPosts = (
  params: CursorRequest = { size: 20 },
) => {
  return api.get<BaseResponse<CompanionPostListResponse>>(
    '/api/companions/scraps',
    { params },
  );
};

export const toggleCompanionPostScrap = (postId: number) => {
  return api.post<BaseResponse<boolean>>(`/api/companions/${postId}/scrap`);
};
