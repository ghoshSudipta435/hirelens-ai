import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { appEnv } from '@/config/env';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiSuccessResponse } from '@/types/api';
import type { AuthSession } from '@/types/auth';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
  withCredentials: true,
});

export const aiApiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
  withCredentials: true,
});

let csrfTokenPromise: Promise<string | null> | null = null;
let cachedCsrfToken: string | null = null;

async function ensureCsrfToken(): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  if (cachedCsrfToken) return cachedCsrfToken;

  if (!csrfTokenPromise) {
    csrfTokenPromise = apiClient
      .get<{ success: boolean; data: { csrfToken: string } }>('/csrf-token')
      .then((response) => {
        cachedCsrfToken = response.data.data.csrfToken;
        return cachedCsrfToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }
  return csrfTokenPromise;
}

// Eagerly pre-fetch CSRF token so it's ready before the first mutation
if (typeof document !== 'undefined') {
  ensureCsrfToken();
}

// Shared refresh promise prevents concurrent refresh calls from racing.
// If multiple 401s fire simultaneously, they all await the same refresh.
let refreshPromise: Promise<AuthSession> | null = null;

export function performRefresh(): Promise<AuthSession> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<ApiSuccessResponse<AuthSession>>('/auth/refresh', {}, { withCredentials: true })
      .then((response) => response.data.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function setupInterceptors(client: typeof apiClient) {
  client.interceptors.request.use(async (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method && !['get', 'head', 'options'].includes(config.method)) {
      const csrfToken = await ensureCsrfToken();
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetriableRequestConfig | undefined;

      if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
        return Promise.reject(error);
      }

      // Don't retry refresh itself — prevents infinite loops
      if (originalRequest.url === '/auth/refresh') {
        useAuthStore.getState().clearSession();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const session = await performRefresh();

        useAuthStore.getState().setSession(session);
        originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;

        return client(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearSession();
        return Promise.reject(refreshError);
      }
    },
  );
}

setupInterceptors(apiClient);
setupInterceptors(aiApiClient);
