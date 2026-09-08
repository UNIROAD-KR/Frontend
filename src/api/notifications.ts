import { DeviceEventEmitter } from 'react-native';
import { api } from "./client";
import { BaseResponse, PageResponse, Pageable } from "./types";

export type NotificationType = "CHAT" | "MATCH" | "LIKE" | "NOTICE" | "SYSTEM";

export interface NotificationResponse {
  notificationId: number;
  type: NotificationType;
  read: boolean;
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

const unwrapNotificationResponse = <T>(payload: T | BaseResponse<T>): T =>
  payload && typeof payload === "object" && "data" in payload
    ? (payload as BaseResponse<T>).data
    : (payload as T);

export const getNotifications = async (params?: Pageable) => {
  const response = await api.get<
    | PageResponse<NotificationResponse>
    | BaseResponse<PageResponse<NotificationResponse>>
  >("/api/v1/notifications", { params });
  const page = unwrapNotificationResponse(response.data);
  return { ...response, data: { data: page } };
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get<
    UnreadCountResponse | BaseResponse<UnreadCountResponse>
  >("/api/v1/notifications/unread-count");
  const payload = unwrapNotificationResponse(response.data);
  const rawCount: unknown = payload?.count;
  const count =
    typeof rawCount === "number"
      ? rawCount
      : typeof rawCount === "string" && rawCount.trim() !== ""
        ? Number(rawCount)
        : NaN;
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("알림 개수 응답의 count가 올바르지 않습니다.");
  }
  return { ...response, data: { data: { count } } };
};

export const markNotificationAsRead = (id: number) => {
  return api.patch<BaseResponse<void>>(`/api/v1/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = () => {
  return api.patch<BaseResponse<void>>("/api/v1/notifications/read-all");
};

export const deleteNotification = (id: number) => {
  return api.delete<BaseResponse<void>>(`/api/v1/notifications/${id}`);
};

export const deleteAllNotifications = () => {
  return api.delete<BaseResponse<void>>("/api/v1/notifications");
};

export const registerFcmToken = (data: FcmTokenRequest) => {
  return api.patch<BaseResponse<void>>("/api/v1/notifications/fcm-token", data);
};

export const sendTestPush = (memberId: number, data: FcmTestPushRequest) => {
  return api.post<FcmPushResponse>(
    `/api/v1/notifications/test-push/${memberId}`,
    data,
  );
};

export const deleteFcmToken = (data: FcmTokenRequest) => {
  return api.delete<BaseResponse<void>>("/api/v1/notifications/fcm-token", {
    data,
  });
};

// 서버에 유형별 count API가 없어 안 읽은 목록의 모든 페이지를 확인한다.
export const getUnreadChatNotificationCount = async () => {
  const ids = new Set<number>();
  let page = 0;
  while (true) {
    const response = await getNotifications({ page, size: 100, sort: ['createdAt,desc'] });
    const result = response.data.data;
    for (const item of result.content) {
      if (item.type === 'CHAT' && item.read !== true) ids.add(item.notificationId);
    }
    if (result.last || page + 1 >= result.totalPages || result.content.length === 0) break;
    page += 1;
  }
  return ids.size;
};

export const NOTIFICATION_READ_EVENT = 'uniroad:notification-read';

export const markChatNotificationsAsRead = async (roomId: number) => {
  const ids = new Set<number>();
  let page = 0;
  // 읽음 처리하면 unread 페이지가 당겨지므로 먼저 모든 대상 ID를 수집한다.
  while (true) {
    const response = await getNotifications({ page, size: 100, sort: ['createdAt,desc'] });
    const result = response.data.data;
    for (const item of result.content) {
      if (item.type === 'CHAT' && item.read !== true &&
          (item.roomId ?? item.referenceId) === roomId) {
        ids.add(item.notificationId);
      }
    }
    if (result.last || page + 1 >= result.totalPages || result.content.length === 0) break;
    page += 1;
  }
  if (!ids.size) return;
  let completed = 0;
  try {
    for (const id of ids) {
      await markNotificationAsRead(id);
      completed += 1;
    }
  } finally {
    if (completed > 0) DeviceEventEmitter.emit(NOTIFICATION_READ_EVENT);
    if (__DEV__) console.log('[Notifications][Chat] 알림 읽음 처리:', { roomId, completed, total: ids.size });
  }
};
