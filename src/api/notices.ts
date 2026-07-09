import { api } from './client';
import { BaseResponse } from './types';

export type NoticeResponse = {
  id: number;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NoticeRequest = {
  title: string;
  content: string;
};

export const getNotices = () => {
  return api.get<BaseResponse<NoticeResponse[]>>('/api/notices');
};

export const getNoticeDetail = (noticeId: number) => {
  return api.get<BaseResponse<NoticeResponse>>(`/api/notices/${noticeId}`);
};

export const createNotice = (data: NoticeRequest) => {
  return api.post<BaseResponse<NoticeResponse>>('/api/notices', data);
};

export const updateNotice = (noticeId: number, data: NoticeRequest) => {
  return api.patch<BaseResponse<NoticeResponse>>(`/api/notices/${noticeId}`, data);
};
