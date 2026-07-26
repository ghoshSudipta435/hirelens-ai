import { apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';

export type SystemMetrics = {
  totalUsers: number;
  totalResumes: number;
  totalJobs: number;
  totalApplications: number;
};

export type AuthLog = {
  id: string;
  eventType: string;
  success: boolean;
  userId: string | null;
  email: string | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export type PaginatedAuthLogs = {
  items: AuthLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function getMetrics(): Promise<SystemMetrics> {
  const response = await apiClient.get<ApiSuccessResponse<SystemMetrics>>('/admin/metrics');
  return response.data.data;
}

export async function getAuthLogs(params: { page: number; limit: number }): Promise<PaginatedAuthLogs> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedAuthLogs>>('/admin/logs', {
    params,
  });
  return response.data.data;
}
