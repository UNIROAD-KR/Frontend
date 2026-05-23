import { api } from './client';
import { BaseResponse } from './types';

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
  capacity: number;
  currentParticipants: number;
  genderRatio?: string;
  createdAt: string;
}

// 동행 구하기 목록 조회
export const getCompanionPosts = () => {
  return api.get<BaseResponse<CompanionPostResponse[]>>('/api/companions');
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
