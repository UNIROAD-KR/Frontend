import { api } from './client';

export const getChatRooms = () => {
  return api.get('/api/v1/chat/rooms');
};

export const createOrGetChatRoom = (data: {
  referenceType: 'TRADE' | 'TICKET';
  referenceId: number;
  targetMemberId: number;
}) => {
  return api.post('/api/v1/chat/rooms', data);
};

export const getChatMessages = (roomId: number) => {
  return api.get(`/api/v1/chat/rooms/${roomId}/messages`, {
    params: {
      page: 0,
      size: 30,
      sort: ['createdAt,asc'],
    },
  });
};
