import { markChatNotificationsAsRead } from './notifications';
import { api } from './client';
import { PageResponse } from './types';

export type ChatReferenceType = 'TRADE' | 'MENTOR' | 'TICKET';

export interface ChatRoomResponse {
  roomId: number;
  referenceType: ChatReferenceType;
  referenceId: number;
  opponentMemberId?: number;
  opponentName?: string;
  opponentNickname?: string;
  lastMessage?: string;
  lastMessageType?: 'TALK' | 'ENTER' | 'QUIT';
  lastMessageCreatedAt?: string;
  unreadCount?: number;
  lastReadAt?: string;
}

export interface ChatMessageResponse {
  id: number;
  roomId: number;
  senderId: number;
  message?: string;
  content?: string;
  type?: string;
  createdAt: string;
  unreadCount?: number;
  readCount?: number;
  read?: boolean;
  readByOpponent?: boolean;
  isRead?: boolean;
}

export interface ChatReadResponse {
  roomId: number;
  lastReadAt: string;
}

export const getChatRooms = () => {
  return api.get<ChatRoomResponse[]>('/api/v1/chat/rooms');
};

export const createOrGetChatRoom = (data: {
  referenceType: ChatReferenceType;
  referenceId: number;
  targetMemberId: number;
}) => {
  return api.post<ChatRoomResponse>('/api/v1/chat/rooms', data);
};

export const getChatMessages = (roomId: number) => {
  return api.get<ChatMessageResponse[] | PageResponse<ChatMessageResponse>>(
    `/api/v1/chat/rooms/${roomId}/messages`,
    {
      params: {
        page: 0,
        size: 30,
        sort: ['createdAt,asc'],
      },
    },
  );
};

export const readChatRoom = async (roomId: number) => {
  const response = await api.post<ChatReadResponse>(`/api/v1/chat/rooms/${roomId}/read`);
  await markChatNotificationsAsRead(roomId);
  return response;
};

export const sendChatMessage = (roomId: number, message: string) => {
  return api.post<ChatMessageResponse>(
    `/api/v1/chat/rooms/${roomId}/messages`,
    {
      message,
      type: 'TALK',
    },
  );
};
