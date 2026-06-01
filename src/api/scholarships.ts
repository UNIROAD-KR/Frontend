import { api } from './client';
import { BaseResponse, PageResponse, Pageable } from './types';

export interface ScholarshipResponse {
  id: number;
  name: string;
  provider: string;
  amount: string;
  target: string;
  eligibility: string;
  description: string;
  tips: string;
  applicationPeriods: string[];
  requiredDocuments: string[];
  essayTips: string[];
  deadline: string;
  officialUrl: string;
}

export const getScholarships = (
  params: { country?: string; keyword?: string } & Pageable = { page: 0, size: 20 },
) => {
  return api.get<BaseResponse<PageResponse<ScholarshipResponse>>>('/api/scholarships', {
    params,
  });
};

export const getScholarship = (id: number) => {
  return api.get<BaseResponse<ScholarshipResponse>>(`/api/scholarships/${id}`);
};
