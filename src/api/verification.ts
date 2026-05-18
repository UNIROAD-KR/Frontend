import { api } from './client';

export const submitVerification = (data: {
  imageUrl: string;
  university: string;
  country: string;
  region: string;
}) => {
  return api.post('/api/v1/verifications', data);
};
