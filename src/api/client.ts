import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { mockApiAdapter } from "./mockAdapter";

const API_BASE_URL = "https://api.uniroad.kr";
const REQUEST_TIMEOUT_MS = 6000;
// 백엔드가 복구되면 false로 바꾸면 실제 서버를 다시 사용합니다.
export const USE_MOCK_API = false;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type FailedQueueItem = {
  resolve: (value: string | null | PromiseLike<string | null>) => void;
  reject: (reason?: unknown) => void;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  adapter: USE_MOCK_API ? mockApiAdapter : undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const accessToken = await AsyncStorage.getItem("accessToken");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export class SessionExpiredError extends Error {
  readonly response: AxiosError["response"];
  readonly cause: unknown;
  readonly originalError: AxiosError;

  constructor(originalError: AxiosError, cause: unknown = originalError) {
    super("로그인이 만료되었습니다. 다시 로그인해주세요.");
    this.name = "SessionExpiredError";
    this.originalError = originalError;
    this.cause = cause;
    // 기존 호출부의 error.response 로깅에 서버 상태와 본문을 그대로 전달한다.
    this.response = axios.isAxiosError(cause) && cause.response
      ? cause.response
      : originalError.response;
  }
}

let sessionExpiration: Promise<void> | null = null;
const expireSession = async () => {
  if (!sessionExpiration) {
    sessionExpiration = (async () => {
      console.log("[Auth] 인증 복구 실패: 저장된 액세스·리프레시 토큰 삭제 시작");
      await AsyncStorage.multiRemove(["accessToken", "refreshToken", "nickname"]);
      delete api.defaults.headers.common.Authorization;
      console.log("[Auth] 로그인 토큰 삭제 완료 → 로그인 화면 이동");
      router.replace("/login");
    })().finally(() => {
      sessionExpiration = null;
    });
  }
  await sessionExpiration;
};

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest
    ) {
      return Promise.reject(error);
    }

    // 인증 정보를 붙인 요청에 대해서만 세션 만료를 처리한다.
    if (!originalRequest.headers.Authorization) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      await expireSession();
      return Promise.reject(new SessionExpiredError(error));
    }

    if (isRefreshing) {
      originalRequest._retry = true;
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (!refreshToken) {
        throw new SessionExpiredError(error, new Error("No refresh token available"));
      }

      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/reissue`,
        {
          refreshToken,
        },
        {
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      const newAccessToken = data.data.accessToken;
      const newRefreshToken = data.data.refreshToken;

      await AsyncStorage.setItem("accessToken", newAccessToken);
      await AsyncStorage.setItem("refreshToken", newRefreshToken);

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      const sessionInvalid = refreshError instanceof SessionExpiredError ||
        (axios.isAxiosError(refreshError) &&
          (refreshError.response?.status === 401 || refreshError.response?.status === 403));
      const failure = refreshError instanceof SessionExpiredError
        ? refreshError
        : sessionInvalid
          ? new SessionExpiredError(error, refreshError)
          : refreshError;
      if (sessionInvalid) {
        await expireSession();
      }
      processQueue(failure, null);
      return Promise.reject(failure);
    } finally {
      isRefreshing = false;
    }
  },
);
