import axios from 'axios';
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
const BASE_URL = 'https://api.uniroad-kr.store';

export const checkUsername = (username: string) => {
  console.log('아이디 중복확인 요청:', {
    url: 'https://api.uniroad-kr.store/api/auth/check-username',
    username,
  });

  return axios.get('https://api.uniroad-kr.store/api/auth/check-username', {
    params: { username },
    headers: {
      Authorization: undefined,
    },
  });
};

export const checkEmail = (email: string) => {
  return axios.get(`${BASE_URL}/api/auth/check-email`, {
    params: { email },
  });
};
export const login = (data: { username: string; password: string }) => {
  return api.post('/api/auth/login', data);
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
