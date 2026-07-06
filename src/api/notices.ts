import { api } from './client';
import { BaseResponse, PageResponse, Pageable } from './types';

export type NoticeResponse = {
  id?: number;
  notificationId?: number;
  type?: string;
  title: string;
  content: string;
  createdAt?: string;
};

export const getNotices = (params?: Pageable) => {
  return api.get<BaseResponse<PageResponse<NoticeResponse>>>(
    '/api/v1/notifications',
    { params },
  );
};
