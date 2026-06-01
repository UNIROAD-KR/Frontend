import { api } from './client';

export type ChatRoom = {
  roomId: number;
  referenceType: 'TRADE' | string;
  referenceId: number;
};

export type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number;
  message: string;
  type: 'TALK' | string;
  createdAt: string;
};

export const getChatRooms = () => {
  return api.get<ChatRoom[]>('/api/v1/chat/rooms');
};

export const createOrGetChatRoom = (data: {
  referenceType: 'TRADE';
  referenceId: number;
  targetMemberId: number;
}) => {
  return api.post<ChatRoom>('/api/v1/chat/rooms', data);
};

export const getChatMessages = (roomId: number, page = 0, size = 30) => {
  return api.get<ChatMessage[]>(`/api/v1/chat/rooms/${roomId}/messages`, {
    params: {
      page,
      size,
    },
  });
};
