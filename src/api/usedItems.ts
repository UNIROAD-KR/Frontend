import { api } from './client';
import { BaseResponse } from './types';

export type TradeCategory = 'KITCHEN' | 'BATH' | 'LIFE' | 'BEDDING' | 'ELECTRONICS' | 'ETC';

export interface TradeItemRequest {
  category: TradeCategory;
  name: string;
  quantity: number;
}

export interface TradeCategoryImageRequest {
  category: TradeCategory;
  imageUrl: string;
}

export interface UsedItemRequest {
  title: string;
  content: string;
  price: number;
  region: string;
  semester: string;
  thumbnailImageUrl: string;
  items?: TradeItemRequest[];
  categoryImages?: TradeCategoryImageRequest[];
}

export interface UsedItemSummaryResponse {
  id: number;
  title: string;
  price: number;
  region: string;
  semester: string;
  thumbnailImageUrl: string;
  authorName: string;
}

export interface TradeItemResponse {
  category: TradeCategory;
  name: string;
  quantity: number;
}

export interface TradeCategoryImageResponse {
  category: TradeCategory;
  imageUrl: string;
}

export interface UsedItemResponse extends UsedItemSummaryResponse {
  content: string;
  items?: TradeItemResponse[];
  categoryImages?: TradeCategoryImageResponse[];
  createdAt: string;
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

export const getUsedItemDetail = (id: number) => {
  return api.get<BaseResponse<UsedItemResponse>>(`/api/used-items/${id}`);
};

export const createUsedItem = (data: UsedItemRequest) => {
  return api.post<BaseResponse<number>>('/api/used-items', data);
};

export const deleteUsedItem = (id: number) => {
  return api.delete<BaseResponse<void>>(`/api/used-items/${id}`);
};
