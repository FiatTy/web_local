import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RefreshResponse } from '@/types/user';
import {
  clearSession,
  getAccessToken,
  hasAccessToken,
  setAccessToken,
} from '@/lib/auth/token-store';

export const API_BASE = import.meta.env.VITE_API_BASE ?? '/backend';

const PUBLIC_PATH_FRAGMENTS = [
  '/login',
  '/register',
  '/reset-password',
  '/forgot-password',
  '/verify-email',
  '/verify-success',
  '/verify-failed',
];

type RetriableRequest = InternalAxiosRequestConfig & { retried?: boolean };
type NavigateHandler = (path: string) => void;

let refreshPromise: Promise<string> | null = null;
let navigateHandler: NavigateHandler | null = null;

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export function setNavigateHandler(handler: NavigateHandler | null): void {
  navigateHandler = handler;
}

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/user/login') ||
    url.includes('/user/register') ||
    url.includes('/user/refresh') ||
    url.includes('/user/logout')
  );
}

function isRefreshEndpoint(url: string): boolean {
  return url.includes('/user/refresh');
}

function isOnPublicPage(): boolean {
  const path = window.location.pathname;
  return PUBLIC_PATH_FRAGMENTS.some((fragment) => path.includes(fragment));
}

function redirectToRoot(): void {
  if (navigateHandler) {
    navigateHandler('/');
    return;
  }
  window.location.assign(import.meta.env.BASE_URL);
}

function handleSessionExpired(): void {
  refreshPromise = null;
  clearSession();
  if (!isOnPublicPage()) {
    redirectToRoot();
  }
}

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<RefreshResponse>('/user/refresh', {})
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url ?? '';
  if (!isAuthEndpoint(url)) {
    const token = getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    if (isRefreshEndpoint(url)) {
      handleSessionExpired();
      return Promise.reject(error);
    }

    const canRefresh =
      (status === 401 || status === 403) &&
      hasAccessToken() &&
      !isAuthEndpoint(url) &&
      original !== undefined &&
      !original.retried;

    if (canRefresh) {
      original.retried = true;
      return refreshAccessToken()
        .then((token) => {
          original.headers.set('Authorization', `Bearer ${token}`);
          return apiClient(original);
        })
        .catch(() => Promise.reject(error));
    }

    return Promise.reject(error);
  },
);
