import { api } from './client';

export const signUp = (data: {
  username: string;
  email: string;
  password: string;
  name: string;
  age: number;
  dispatchedUniversity: string;
  dispatchedCountry: string;
  dispatchedRegion: string;
}) => {
  return api.post('/api/auth/sign-up', data);
};

export const login = (data: { username: string; password: string }) => {
  return api.post('/api/auth/login', data);
};

export const checkEmail = (email: string) => {
  return api.get('/api/auth/check-email', {
    params: { email },
  });
};

export const reissueToken = (refreshToken: string) => {
  return api.post('/api/auth/reissue', {
    refreshToken,
  });
};

export const socialLogin = (provider: string, accessToken: string) => {
  return api.post('/api/auth/social-login', {
    provider,
    accessToken,
  });
};

export const logout = () => {
  return api.post('/api/auth/logout');
};
