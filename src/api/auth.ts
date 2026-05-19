import { api } from './client';

export type AuthStatus = 'NEED_SIGNUP' | 'NEED_ONBOARDING' | 'ACTIVE';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  status: AuthStatus;
}

// 백엔드 공통 응답 구조 (data 안에 실제 내용이 들어있는 형태)
export interface BaseResponse<T> {
  data: T;
  message?: string;
  status?: number;
  [key: string]: any;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface OnboardingRequest {
  age: number;
  dispatchedUniversity: string;
  dispatchedCountry: string;
  dispatchedRegion: string;
}

export interface SocialSignUpRequest {
  username: string;
  password: string;
  email?: string;
}

export const signUp = (data: SignUpRequest) => {
  return api.post('/api/auth/sign-up', data);
};

export const socialSignUp = (data: SocialSignUpRequest) => {
  return api.post<BaseResponse<void>>('/api/auth/social-sign-up', data);
};

export const onboarding = (data: OnboardingRequest) => {
  return api.post('/api/auth/onboarding', data);
};

export const login = (data: { username: string; password: string }) => {
  return api.post<BaseResponse<LoginResponse>>('/api/auth/login', data);
};

export const checkUsername = (username: string) => {
  return api.get('/api/auth/check-username', {
    params: { username },
  });
};

export const checkEmail = (email: string) => {
  return api.get('/api/auth/check-email', {
    params: { email },
  });
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


