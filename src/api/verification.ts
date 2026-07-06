import { api } from './client';
import { BaseResponse } from './types';

export interface VerificationResponse {
  id: number;
  imageUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface AdminVerificationResponse {
  memberId: number;
  memberName: string;
  memberEmail: string;
  verification: VerificationResponse;
}

export const submitVerification = (data: {
  imageUrl: string;
  university: string;
  country: string;
  region: string;
}) => {
  return api.post<BaseResponse<VerificationResponse>>('/api/v1/verifications', data);
};

export const getMyVerifications = () => {
  return api.get<BaseResponse<VerificationResponse[]>>('/api/v1/verifications/me');
};
