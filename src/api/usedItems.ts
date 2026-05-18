import { api } from './client';

export type UsedItem = {
  id: number;
  title: string;
  content: string;
  price: number;
  region: string;
  semester: string;
  authorName: string;
  imageUrls: string[];
  createdAt: string;
};

export type CreateUsedItemRequest = {
  title: string;
  content: string;
  price: number;
  region: string;
  semester: string;
  imageUrls: string[];
};

export const getUsedItems = () => {
  return api.get('/api/used-items');
};

export const getUsedItemDetail = (id: number) => {
  return api.get(`/api/used-items/${id}`);
};

export const createUsedItem = (data: {
  title: string;
  content: string;
  price: number;
  region: string;
  semester: string;
  thumbnailImageUrl: string;
  items: {
    category: string;
    name: string;
    quantity: number;
  }[];
  categoryImages: {
    category: string;
    imageUrl: string;
  }[];
}) => {
  return api.post('/api/used-items', data);
};

export const deleteUsedItem = (id: number) => {
  return api.delete(`/api/used-items/${id}`);
};
