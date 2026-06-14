import { api } from './client';
import { BaseResponse, CursorResponse } from './types';

export type TicketType = 'TOUR' | 'CONCERT' | 'TRAIN' | 'FLIGHT' | 'ACCOMMODATION';

export interface TicketTransferRequest {
  ticketType: TicketType;
  title: string;
  content?: string;
  country: string;
  eventDate: string;
  eventEndDate?: string;
  eventTime: string;
  location: string;
  quantity: number;
  transferPrice: number;
  originalPrice: number;
}

export interface TicketTransferResponse {
  id: number;
  authorName: string;
  authorNickname?: string;
  authorDispatchedCountry?: string;
  authorDispatchedRegion?: string;
  authorDispatchRegion?: string;
  authorDispatchedUniversity?: string;
  authorDispatchYear?: number | string;
  authorDispatchSemester?: number | string;
  authorDispatchStartDate?: string;
  ticketType: TicketType;
  title: string;
  content: string;
  country: string;
  eventDate: string;
  eventEndDate?: string;
  eventTime: string;
  location: string;
  quantity: number;
  transferPrice: number;
  originalPrice?: number;
  status: 'AVAILABLE' | 'COMPLETED';
  createdAt?: string;
  updatedAt?: string;
}

// 티켓 양도 글 작성
export type TicketTransferListResponse = CursorResponse<TicketTransferResponse>;

export const createTicket = (data: TicketTransferRequest) => {
  return api.post<BaseResponse<number>>('/api/tickets', data);
};

// 티켓 양도 목록 조회
export const getTickets = (cursorId?: number, size = 10) => {
  return api.get<BaseResponse<TicketTransferListResponse>>('/api/tickets', {
    params: {
      cursorId,
      size,
    },
  });
};

// 내 티켓 양도 글 조회
export const getMyTickets = (
  params: { cursorId?: number; size?: number } = { size: 20 },
) => {
  return api.get<BaseResponse<TicketTransferListResponse>>('/api/tickets/my', {
    params,
  });
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
