import { api } from './client';

export type ApiResponse<T> = {
  timestamp: string;
  status: number;
  message: string;
  data: T;
};

export type PageResponse<T> = {
  content: T[];
  pageable: unknown;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: unknown;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
};

export type PartnerUniversityListParams = {
  country?: string;
  keyword?: string;
  major?: string;
  language?: string;
  dormitoryAvailable?: boolean;
  page?: number;
  size?: number;
};

export type PartnerUniversitySummary = {
  id: number;
  name: string;
  country: string;
  city: string | null;
  thumbnailUrl: string | null;
  avgRating: number;
  reviewCount: number;
};

export type PartnerUniversityDetail = {
  id: number;
  name: string;
  country: string;
  city: string | null;
  description: string | null;
  websiteUrl: string | null;
  thumbnailUrl: string | null;
  classLanguages: string[] | null;
  supportedMajors: string[] | null;
  creditTransferPossible: boolean | null;
  internationalOfficeEmail: string | null;
  internationalOfficeSnsUrl: string | null;
  minGpa: number | null;
  languageRequirement: string | null;
  requiredDocuments: string[] | null;
  dormitoryAvailable: boolean | null;
  dormitoryType: string | null;
  dormitoryPrice: number | null;
  housingDescription: string | null;
  nearbyEnvironment: string | null;
  rentAvg: number | null;
  mealAvg: number | null;
  transportAvg: number | null;
  avgRating: number;
  reviewCount: number;
};

export type ExchangeSchedule = {
  title: string;
  startDate: string;
  endDate: string;
};

export type UniversityExchangeInfo = {
  universityName: string;
  eligibility: string | null;
  creditPolicy: string | null;
  requiredDocuments: string[] | null;
  internationalOfficeUrl: string | null;
  schedules: ExchangeSchedule[];
};

export type ScholarshipListParams = {
  country?: string;
  keyword?: string;
  page?: number;
  size?: number;
};

export type Scholarship = {
  id: number;
  name: string;
  provider: string | null;
  amount: string | null;
  deadline: string | null;
  officialUrl: string | null;
};

export type ReviewListParams = {
  partnerUniversityId?: number;
  country?: string;
  page?: number;
  size?: number;
};

export type ReviewSummary = {
  id: number;
  title: string;
  summary: string | null;
  rating: number;
  authorNickname: string | null;
  createdAt: string;
};

export const getPartnerUniversities = (params?: PartnerUniversityListParams) => {
  return api.get<ApiResponse<PageResponse<PartnerUniversitySummary>>>(
    '/api/partner-universities',
    { params },
  );
};

export const getPartnerUniversityDetail = (id: number) => {
  return api.get<ApiResponse<PartnerUniversityDetail>>(
    `/api/partner-universities/${id}`,
  );
};

export const getUniversityExchangeInfo = (id: number) => {
  return api.get<ApiResponse<UniversityExchangeInfo>>(
    `/api/universities/${id}/exchange-info`,
  );
};

export const getScholarships = (params?: ScholarshipListParams) => {
  return api.get<ApiResponse<PageResponse<Scholarship>>>('/api/scholarships', {
    params,
  });
};

export const getReviews = (params?: ReviewListParams) => {
  return api.get<ApiResponse<PageResponse<ReviewSummary>>>('/api/reviews', {
    params,
  });
};
