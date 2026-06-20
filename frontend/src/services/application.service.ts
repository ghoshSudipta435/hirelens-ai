import { apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { Application, ApplicationListQuery, CreateApplicationRequest, PaginatedResponse } from '@/types/application';

export async function createApplication(input: CreateApplicationRequest): Promise<Application> {
  const response = await apiClient.post<ApiSuccessResponse<Application>>('/applications', input);
  return response.data.data;
}

export async function listApplications(query?: ApplicationListQuery): Promise<PaginatedResponse<Application>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResponse<Application>>>('/applications', {
    params: query,
  });
  return response.data.data;
}

export async function getApplication(applicationId: string): Promise<Application> {
  const response = await apiClient.get<ApiSuccessResponse<Application>>(`/applications/${applicationId}`);
  return response.data.data;
}

export async function updateApplicationStatus(applicationId: string, status: string): Promise<Application> {
  const response = await apiClient.patch<ApiSuccessResponse<Application>>(`/applications/${applicationId}/status`, { status });
  return response.data.data;
}
