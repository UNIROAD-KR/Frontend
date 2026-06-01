import { api } from './client';

export const submitVerification = (data: { imageUrl: string }) => {
  return api.post('/api/v1/verifications', data);
};
