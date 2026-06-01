import { api } from './client';
import { BaseResponse, PageResponse, Pageable } from './types';

export interface PartnerSchoolSummaryResponse {
  id: number;
  name: string;
  country: string;
  city: string;
  rating: number;
  tags: string[];
  thumbnailImageUrl: string;
}

export interface BasicInfo {
  language?: string;
  departments?: string;
  semesterSystem?: string;
  website?: string;
  contact?: string;
}

export interface LivingInfo {
  dorm?: string;
  transport?: string;
  costLevel?: string;
  costDescription?: string;
  environment?: string;
  safetyScore?: number;
  safetyDescription?: string;
}

export interface PartnerSchoolDetailResponse extends PartnerSchoolSummaryResponse {
  imageUrls: string[];
  basicInfo?: BasicInfo;
  livingInfo?: LivingInfo;
  bookmarkedByMe: boolean;
}

export interface PartnerSchoolBookmarkResponse {
  bookmarkedByMe: boolean;
}

export const getPartnerSchools = (
  params: { keyword?: string; country?: string } & Pageable = { page: 0, size: 20 },
) => {
  return api.get<BaseResponse<PageResponse<PartnerSchoolSummaryResponse>>>('/api/partner-schools', {
    params,
  });
};

export const getPartnerSchool = (id: number) => {
  return api.get<BaseResponse<PartnerSchoolDetailResponse>>(`/api/partner-schools/${id}`);
};

export const bookmarkPartnerSchool = (id: number) => {
  return api.post<BaseResponse<PartnerSchoolBookmarkResponse>>(`/api/partner-schools/${id}/bookmark`);
};

export const unbookmarkPartnerSchool = (id: number) => {
  return api.delete<BaseResponse<PartnerSchoolBookmarkResponse>>(`/api/partner-schools/${id}/bookmark`);
};
