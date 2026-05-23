import { api } from './client';
import { BaseResponse } from './types';

export interface VerificationResponse {
  id: number;
  imageUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface AdminVerificationResponse {
  memberId: number;
  memberName: string;
  memberEmail: string;
  verification: VerificationResponse;
}

export const submitVerification = (data: {
  imageUrl: string;
}) => {
  return api.post<BaseResponse<VerificationResponse>>('/api/v1/verifications', data);
};

// 대기 중인 인증 목록 조회 (관리자)
export const getPendingVerifications = () => {
  return api.get<BaseResponse<AdminVerificationResponse[]>>('/api/v1/verifications/pending');
};

// 인증 승인 (관리자)
export const approveVerification = (id: number) => {
  return api.post<BaseResponse<void>>(`/api/v1/verifications/${id}/approve`);
};

// 인증 거절 (관리자)
export const rejectVerification = (id: number, reason: string) => {
  return api.post<BaseResponse<void>>(`/api/v1/verifications/${id}/reject`, { reason });
};
