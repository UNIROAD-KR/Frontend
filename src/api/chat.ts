import { api } from './client';
import { BaseResponse, PageResponse } from './types';

export type ChatReferenceType = 'TRADE' | 'MENTOR';

export interface ChatRoomResponse {
  roomId: number;
  referenceType: ChatReferenceType;
  referenceId: number;
}

export interface ChatMessageResponse {
  id: number;
  roomId: number;
  senderId: number;
  message?: string;
  content?: string;
  type?: string;
  createdAt: string;
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

export const sendChatMessage = (roomId: number, message: string) => {
  return api.post<BaseResponse<ChatMessageResponse>>(
    `/api/v1/chat/rooms/${roomId}/messages`,
    {
      message,
      type: 'TALK',
    },
  );
};
