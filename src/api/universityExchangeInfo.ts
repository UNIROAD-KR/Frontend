import { api } from './client';
import { BaseResponse } from './types';

export interface ExchangeScheduleResponse {
  title: string;
  startDate: string;
  endDate: string;
}

export interface UniversityExchangeInfoResponse {
  universityName: string;
  eligibility: string;
  creditPolicy: string;
  requiredDocuments: string[];
  internationalOfficeUrl: string;
  schedules: ExchangeScheduleResponse[];
}

export interface ScheduleResponse {
  title: string;
  period: string;
}

export interface DocumentCheckResponse {
  id: number;
  text: string;
  checkedByMe: boolean;
}

export interface MyUniversityPartnerSchool {
  id: number;
  name: string;
  country: string;
  city: string;
  rating: number;
}

export interface TipResponse {
  title: string;
  content: string;
}

export interface BlogLinkResponse {
  title: string;
  url: string;
}

export interface MyUniversityExchangeInfoResponse {
  universityName: string;
  officeName: string;
  phone: string;
  email: string;
  eligibility: string[];
  schedules: ScheduleResponse[];
  requiredDocuments: DocumentCheckResponse[];
  partnerSchools: MyUniversityPartnerSchool[];
  tips: TipResponse[];
  blogLinks: BlogLinkResponse[];
}

export const getUniversityExchangeInfo = (id: number) => {
  return api.get<BaseResponse<UniversityExchangeInfoResponse>>(`/api/universities/${id}/exchange-info`);
};

export const getMyUniversityExchangeInfo = () => {
  return api.get<BaseResponse<MyUniversityExchangeInfoResponse>>('/api/my-university/exchange-info');
};

export const updateMyUniversityDocumentCheck = (documentId: number, checked: boolean) => {
  return api.patch<BaseResponse<DocumentCheckResponse>>(
    `/api/my-university/exchange-info/documents/${documentId}`,
    { checked },
  );
};
