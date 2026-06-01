import axios from 'axios';
import { api } from './client';

export const signUp = (data: {
  username: string;
  email?: string;
  password: string;
  name: string;
}

export interface OnboardingRequest {
  age?: number;
  nickname: string;
  gender: 'MALE' | 'FEMALE';
  currentSituation: 'PREPARING_APPLICATION' | 'PREPARING_DEPARTURE' | 'DISPATCHED';
  domesticUniversity: string;
  dispatchedUniversity?: string;
  dispatchedCountry?: string;
  dispatchedRegion?: string;
}

export interface SocialSignUpRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
}

export interface MemberResponse {
  id: number;
  username: string;
  email: string;
  name: string;
  nickname: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  currentSituation: OnboardingRequest['currentSituation'] | null;
  age: number | null;
  domesticUniversityId?: number | null;
  domesticUniversity: string | null;
  homeUniversity?: string | null;
  dispatchedUniversity: string | null;
  dispatchedCountry: string | null;
  dispatchedRegion: string | null;
  role: string;
  status: AuthStatus;
  balance: number;
}

export const signUp = (data: SignUpRequest) => {
  return api.post('/api/auth/sign-up', data);
};

export const login = (data: { username: string; password: string }) => {
  return api.post('/api/auth/login', data);
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
  return api.post<BaseResponse<LoginResponse>>('/api/auth/reissue', {
    refreshToken,
  });
};

export const socialLogin = (provider: string, accessToken: string) => {
  return api.post<BaseResponse<LoginResponse>>('/api/auth/social-login', {
    provider,
    accessToken,
  });
};

export const logout = () => {
  return api.post('/api/auth/logout');
};

export const getMemberMe = () => {
  return api.get<BaseResponse<MemberResponse>>('/api/members/me');
};
