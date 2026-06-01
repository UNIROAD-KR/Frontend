import { api } from './client';
import { BaseResponse } from './types';

export interface PopularCountryResponse {
  name: string;
  code: string;
  schoolCount: number;
  reviewCount: number;
}

export const getPopularCountries = () => {
  return api.get<BaseResponse<PopularCountryResponse[]>>('/api/exchange-info/popular-countries');
};
