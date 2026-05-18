import { api } from './client';

export type AuthStatus = 'NEED_SIGNUP' | 'NEED_ONBOARDING' | 'ACTIVE';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  status: AuthStatus;
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

export const signUp = (data: SignUpRequest) => {
  return api.post('/api/auth/sign-up', data);
};

export const onboarding = (data: OnboardingRequest) => {
  return api.post('/api/auth/onboarding', data);
};

export const login = (data: { username: string; password: string }) => {
  return api.post<LoginResponse>('/api/auth/login', data);
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
  return api.post<LoginResponse>('/api/auth/reissue', {
    refreshToken,
  });
};

export const socialLogin = (provider: string, accessToken: string) => {
  return api.post<LoginResponse>('/api/auth/social-login', {
    provider,
    accessToken,
  });
};

export const logout = () => {
  return api.post('/api/auth/logout');
};

