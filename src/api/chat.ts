import { api } from './client';
import { BaseResponse, Pageable } from './types';

export type ChatReferenceType = 'TRADE' | 'MENTOR';
export type ChatMessageType = 'TALK' | 'ENTER' | 'QUIT';

export interface ChatRoomRequest {
  referenceType: ChatReferenceType;
  referenceId: number;
  targetMemberId: number;
}

export interface ChatRoomResponse {
  roomId: number;
  referenceType: ChatReferenceType;
  referenceId: number;
}

export interface ChatMessageResponse {
  id: number;
  roomId: number;
  senderId: number;
  message: string;
  type: ChatMessageType;
  createdAt: string;
}

export const getChatRooms = () => {
  return api.get<ChatRoomResponse[]>('/api/v1/chat/rooms');
};

export const createOrGetChatRoom = (data: ChatRoomRequest) => {
  return api.post<ChatRoomResponse>('/api/v1/chat/rooms', data);
};

export const getChatMessages = (
  roomId: number,
  pageable: Pageable = { page: 0, size: 30, sort: ['createdAt,asc'] },
) => {
  return api.get<ChatMessageResponse[] | BaseResponse<ChatMessageResponse[]>>(
    `/api/v1/chat/rooms/${roomId}/messages`,
    { params: pageable },
  );
};
