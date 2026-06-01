import { api } from './client';
import { BaseResponse } from './types';

export type TicketType = 'TOUR' | 'CONCERT' | 'TRAIN' | 'FLIGHT' | 'ACCOMMODATION';

export interface TicketTransferRequest {
  ticketType: TicketType;
  title: string;
  content?: string;
  eventDate: string;
  eventTime: string;
  location: string;
  quantity: number;
  transferPrice: number;
  originalPrice?: number;
}

export interface TicketTransferResponse {
  id: number;
  authorName: string;
  ticketType: TicketType;
  title: string;
  content: string;
  eventDate: string;
  eventTime: string;
  location: string;
  quantity: number;
  transferPrice: number;
  originalPrice: number;
  status: 'AVAILABLE' | 'COMPLETED';
}

// 티켓 양도 글 작성
export const createTicket = (data: TicketTransferRequest) => {
  return api.post<BaseResponse<number>>('/api/tickets', data);
};

// 티켓 양도 상세 조회
export const getTicketDetail = (id: number) => {
  return api.get<BaseResponse<TicketTransferResponse>>(`/api/tickets/${id}`);
};

// 티켓 양도 수정
export const updateTicket = (id: number, data: TicketTransferRequest) => {
  return api.put<BaseResponse<void>>(`/api/tickets/${id}`, data);
};

// 티켓 양도 삭제
export const deleteTicket = (id: number) => {
  return api.delete<BaseResponse<void>>(`/api/tickets/${id}`);
};

// 판매 완료 처리
export const completeTicketTransfer = (id: number) => {
  return api.patch<BaseResponse<void>>(`/api/tickets/${id}/complete`);
};
