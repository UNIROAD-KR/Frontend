import { api } from './client';
import { BaseResponse } from './types';

export type TradeCategory = 'KITCHEN' | 'BATH' | 'LIFE' | 'BEDDING' | 'ELECTRONICS' | 'ETC';

export interface TradeItemRequest {
  category: TradeCategory;
  name: string;
  quantity: number;
  description?: string;
}

export interface TradeCategoryImageRequest {
  category: TradeCategory;
  imageUrl: string;
}

export interface UsedItemRequest {
  title: string;
  content: string;
  price: number;
  country?: string;
  region: string;
  semester: string;
  returnDate?: string;
  thumbnailImageUrl: string;
  items?: TradeItemRequest[];
  categoryImages?: TradeCategoryImageRequest[];
}

export interface UsedItemSummaryResponse {
  id: number;
  title: string;
  price: number;
  country?: string;
  region: string;
  semester: string;
  thumbnailImageUrl: string;
  authorName: string;
  authorNickname?: string;
  authorDomesticUniversity?: string;
  authorHomeUniversity?: string;
  authorDispatchedUniversity?: string;
  authorDispatchedCountry?: string;
  authorDispatchedRegion?: string;
  authorDispatchYear?: number;
  authorDispatchSemester?: string | number;
  authorDispatchStartDate?: string;
  authorVerified?: boolean;
  likeCount?: number;
  likedByMe?: boolean;
  chatCount?: number;
  memberId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TradeItemResponse {
  category: TradeCategory;
  name: string;
  quantity: number;
  description?: string;
}

export interface TradeCategoryImageResponse {
  category: TradeCategory;
  imageUrl: string;
}

export interface UsedItemResponse extends UsedItemSummaryResponse {
  memberId: number;
  content: string;
  items?: TradeItemResponse[];
  categoryImages?: TradeCategoryImageResponse[];
  createdAt: string;
  returnDate?: string;
}

export type UsedItem = UsedItemSummaryResponse;

export interface UsedItemListResponse {
  items: UsedItemSummaryResponse[];
  hasNext: boolean;
  nextCursorId: number | null;
}

export const getUsedItems = () => {
  return api.get<BaseResponse<UsedItemListResponse>>('/api/used-items');
};

export const getMyUsedItems = (
  params: { cursorId?: number; size?: number } = { size: 20 },
) => {
  return api.get<BaseResponse<UsedItemListResponse>>('/api/used-items/my', {
    params,
  });
};

export const getUsedItemDetail = (id: number) => {
  return api.get<BaseResponse<UsedItemResponse>>(`/api/used-items/${id}`);
};

export const createUsedItem = (data: UsedItemRequest) => {
  return api.post<BaseResponse<number>>('/api/used-items', data);
};

export const deleteUsedItem = (id: number) => {
  return api.delete<BaseResponse<void>>(`/api/used-items/${id}`);
};
