import { api } from './client';
import { BaseResponse, PageResponse, Pageable } from './types';

export type NotificationType = 'CHAT' | 'MATCH' | 'LIKE' | 'NOTICE' | 'SYSTEM';

export interface NotificationResponse {
  notificationId: number;
  type: NotificationType;
  title: string;
  content: string;
  referenceId?: number | null;
  roomId?: number | null;
  createdAt: string;
}

export interface FcmTokenRequest {
  token: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface FcmTestPushRequest {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface FcmPushResponse {
  targetMemberId: number;
  tokenCount: number;
  successCount: number;
  firebaseAvailable: boolean;
}

export const getNotifications = (params?: Pageable) => {
  return api.get<BaseResponse<PageResponse<NotificationResponse>>>(
    '/api/v1/notifications',
    { params },
  );
};

export const getUnreadNotificationCount = () => {
  return api.get<BaseResponse<UnreadCountResponse>>(
    '/api/v1/notifications/unread-count',
  );
};

export const markNotificationAsRead = (id: number) => {
  return api.patch<BaseResponse<void>>(`/api/v1/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = () => {
  return api.patch<BaseResponse<void>>('/api/v1/notifications/read-all');
};

export const deleteNotification = (id: number) => {
  return api.delete<BaseResponse<void>>(`/api/v1/notifications/${id}`);
};

export const deleteAllNotifications = () => {
  return api.delete<BaseResponse<void>>('/api/v1/notifications');
};

export const registerFcmToken = (data: FcmTokenRequest) => {
  return api.patch<BaseResponse<void>>('/api/v1/notifications/fcm-token', data);
};

export const sendTestPush = (memberId: number, data: FcmTestPushRequest) => {
  return api.post<FcmPushResponse>(
    `/api/v1/notifications/test-push/${memberId}`,
    data,
  );
};
