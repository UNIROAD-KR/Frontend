import { api } from './client';
import { BaseResponse } from './types';

export interface CountryResponse {
  id: number;
  code: string;
  name: string;
}

export const getCountries = () => {
  return api.get<BaseResponse<CountryResponse[]>>('/api/countries');
};
