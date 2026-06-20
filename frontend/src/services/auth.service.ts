import { apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { AuthSession, AuthUser, LoginRequest, RegisterRequest } from '@/types/auth';

export async function login(input: LoginRequest): Promise<AuthSession> {
  const response = await apiClient.post<ApiSuccessResponse<AuthSession>>('/auth/login', input);
  return response.data.data;
}

export async function register(input: RegisterRequest): Promise<AuthSession> {
  const response = await apiClient.post<ApiSuccessResponse<AuthSession>>('/auth/register', input);
  return response.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', {});
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<ApiSuccessResponse<AuthUser>>('/auth/profile');
  return response.data.data;
}
