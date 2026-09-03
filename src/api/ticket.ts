import { api } from './client';
import { BaseResponse, CursorResponse } from './types';
import type { AxiosResponse } from 'axios';

export type TicketType = 'TOUR' | 'CONCERT' | 'TRAIN' | 'FLIGHT' | 'ACCOMMODATION';

export interface TicketTransferRequest {
  ticketType: TicketType | 'OTHER';
  customTicketType?: string;
  title: string;
  content?: string;
  country: string;
  useDate?: string;
  useTime?: string;
  placeName?: string;
  performanceDate?: string;
  performanceTime?: string;
  performancePlace?: string;
  departureDate?: string;
  departureTime?: string;
  departureStation?: string;
  arrivalStation?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  checkInDate?: string;
  checkOutDate?: string;
  accommodationName?: string;
  quantity: number;
  transferPrice: number;
  originalPrice: number;
}

export interface TicketTransferResponse {
  id: number;
  memberId?: number;
  authorId?: number;
  authorMemberId?: number;
  authorName: string;
  authorNickname?: string;
  authorDomesticUniversity?: string;
  authorHomeUniversity?: string;
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
  scrapCount?: number;
  thumbnailImageUrl?: string;
  imageUrls?: string[];
  eventDate: string;
  eventEndDate?: string;
  eventTime: string;
  location: string;
  customTicketType?: string;
  useDate?: string;
  useTime?: string;
  placeName?: string;
  performanceDate?: string;
  performanceTime?: string;
  performancePlace?: string;
  departureDate?: string;
  departureTime?: string;
  departureStation?: string;
  arrivalStation?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  checkInDate?: string;
  checkOutDate?: string;
  accommodationName?: string;
  quantity: number;
  transferPrice: number;
  originalPrice?: number;
  status: 'AVAILABLE' | 'COMPLETED';
  createdAt?: string;
  updatedAt?: string;
}

// 티켓 양도 글 작성
export type TicketTransferListResponse = CursorResponse<TicketTransferResponse>;

const normalizeTicket = (ticket: TicketTransferResponse): TicketTransferResponse => {
  if (ticket.ticketType === 'TOUR') {
    return {
      ...ticket,
      eventDate: ticket.eventDate ?? ticket.useDate ?? '',
      eventTime: ticket.eventTime ?? ticket.useTime ?? '',
      location: ticket.location ?? ticket.placeName ?? '',
    };
  }

  if (ticket.ticketType === 'CONCERT') {
    return {
      ...ticket,
      eventDate: ticket.eventDate ?? ticket.performanceDate ?? '',
      eventTime: ticket.eventTime ?? ticket.performanceTime ?? '',
      location: ticket.location ?? ticket.performancePlace ?? '',
    };
  }

  if (ticket.ticketType === 'TRAIN') {
    return {
      ...ticket,
      eventDate: ticket.eventDate ?? ticket.departureDate ?? '',
      eventTime: ticket.eventTime ?? ticket.departureTime ?? '',
      location:
        ticket.location ??
        [ticket.departureStation, ticket.arrivalStation].filter(Boolean).join(' → '),
    };
  }

  if (ticket.ticketType === 'FLIGHT') {
    return {
      ...ticket,
      eventDate: ticket.eventDate ?? ticket.departureDate ?? '',
      eventTime: ticket.eventTime ?? ticket.departureTime ?? '',
      location:
        ticket.location ??
        [ticket.departureAirport, ticket.arrivalAirport].filter(Boolean).join(' → '),
    };
  }

  const checkInDate = ticket.checkInDate ?? ticket.eventDate ?? '';
  const checkOutDate = ticket.checkOutDate ?? ticket.eventEndDate ?? '';

  return {
    ...ticket,
    eventDate: checkOutDate ? `${checkInDate}~${checkOutDate}` : checkInDate,
    eventTime: ticket.eventTime ?? '',
    location: ticket.location ?? ticket.accommodationName ?? '',
  };
};

const normalizeTicketListResponse = (
  response: AxiosResponse<BaseResponse<TicketTransferListResponse>>,
) => {
  response.data.data.items = (response.data.data.items ?? []).map(normalizeTicket);
  return response;
};

export type TicketSearchParams = {
  cursorId?: number;
  title?: string;
  country?: string;
  location?: string;
  content?: string;
  status?: string;
  size?: number;
};

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
  }).then(normalizeTicketListResponse);
};

export const searchTickets = (params: TicketSearchParams = { size: 20 }) => {
  return api.get<BaseResponse<TicketTransferListResponse>>('/api/tickets/search', {
    params,
  }).then(normalizeTicketListResponse);
};

// 내 티켓 양도 글 조회
export const getMyTickets = (
  params: { cursorId?: number; size?: number } = { size: 20 },
) => {
  return api.get<BaseResponse<TicketTransferListResponse>>('/api/tickets/my', {
    params,
  }).then(normalizeTicketListResponse);
};

export const getScrappedTickets = (
  params: { cursorId?: number; size?: number } = { size: 20 },
) => {
  return api.get<BaseResponse<TicketTransferListResponse>>('/api/tickets/scraps', {
    params,
  }).then(normalizeTicketListResponse);
};

// 티켓 양도 상세 조회
export const getTicketDetail = (id: number) => {
  return api
    .get<BaseResponse<TicketTransferResponse>>(`/api/tickets/${id}`)
    .then((response) => {
      response.data.data = normalizeTicket(response.data.data);
      return response;
    });
};

// 티켓 양도 수정
export const updateTicket = (id: number, data: TicketTransferRequest) => {
  return api.put<BaseResponse<void>>(`/api/tickets/${id}`, data);
};

// 티켓 양도 삭제
export const deleteTicket = (id: number) => {
  return api.delete<BaseResponse<void>>(`/api/tickets/${id}`);
};

export const toggleTicketScrap = (id: number) => {
  return api.post<BaseResponse<boolean>>(`/api/tickets/${id}/scrap`);
};

// 판매 완료 처리
export const completeTicketTransfer = (id: number) => {
  return api.patch<BaseResponse<void>>(`/api/tickets/${id}/complete`);
};
