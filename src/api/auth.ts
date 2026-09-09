import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRegisteredFcmToken, LAST_REGISTERED_TOKEN_KEY } from "../notifications/tokenStorage";
import { api } from './client';
import { BaseResponse } from './types';

export type AuthStatus = 'NEED_SIGNUP' | 'NEED_ONBOARDING' | 'ACTIVE';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  accessTokenExpiresIn?: number;
  status: AuthStatus;
}

export interface SignUpRequest {
  username: string;
  email?: string;
  password: string;
  name: string;
}

export type CurrentSituation =
  | 'PREPARING_APPLICATION'
  | 'WAITING_RESULT'
  | 'ACCEPTED'
  | 'PREPARING_DEPARTURE'
  | 'DISPATCHED'
  | 'RETURNED';

export interface OnboardingRequest {
  age?: number;
  nickname: string;
  gender?: 'MALE' | 'FEMALE';
  currentSituation: CurrentSituation;
  domesticUniversity: string;
  dispatchedUniversity?: string;
  dispatchedCountry?: string;
  dispatchedRegion?: string;
  dispatchSemester?: string;
  applicationDeadline?: string;
  departureDate?: string;
  dispatchStartDate?: string;
}

export interface MemberProfileUpdateRequest {
  nickname?: string;
  dispatchedCountry?: string;
  dispatchedRegion?: string;
  currentSituation?: CurrentSituation;
  dispatchedUniversity?: string;
  domesticUniversity?: string;
  dispatchSemester?: string | null;
  applicationDeadline?: string | null;
  departureDate?: string | null;
  dispatchStartDate?: string | null;
  returnDate?: string | null;
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
  dispatchSemester?: string | null;
  applicationDeadline?: string | null;
  departureDate?: string | null;
  dispatchStartDate?: string | null;
  role: string;
  status: AuthStatus;
  balance: number;
}

export interface PasswordUpdateRequest {
  currentPassword?: string;
  newPassword: string;
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

export const logout = async () => {
  const fcmToken = await getRegisteredFcmToken();
  console.log(fcmToken
    ? '[Auth] 로그아웃 요청: 백엔드 FCM 토큰 삭제 포함'
    : '[Auth] 로그아웃 요청: 저장된 FCM 토큰 없음');
  const response = await api.post('/api/auth/logout', fcmToken ? { fcmToken } : {});
  console.log('[Auth] 로그아웃 서버 처리 완료');
  await AsyncStorage.removeItem(LAST_REGISTERED_TOKEN_KEY);
  console.log("[FCM] 저장된 토큰 캐시 삭제 완료");
  return response;
};

export const deleteMyAccount = () => {
  return api.delete<BaseResponse<void>>('/api/members/me');
};

export const getMemberMe = () => {
  return api.get<BaseResponse<MemberResponse>>('/api/members/me');
};

export const updateMemberProfile = (data: MemberProfileUpdateRequest) => {
  return api.patch<BaseResponse<MemberResponse>>('/api/members/me/profile', data);
};

export const updatePassword = (data: PasswordUpdateRequest) => {
  return api.patch<BaseResponse<void>>('/api/members/me/password', data);
};
