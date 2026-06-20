import { apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { CreateResumeRequest, Resume, UpdateResumeRequest } from '@/types/resume';

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function createResume(input: CreateResumeRequest): Promise<Resume> {
  const response = await apiClient.post<ApiSuccessResponse<Resume>>('/resumes', input);
  return response.data.data;
}

export async function listResumes(page = 1, limit = 20): Promise<PaginatedResponse<Resume>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResponse<Resume>>>(`/resumes?page=${page}&limit=${limit}`);
  return response.data.data;
}

export async function getResume(resumeId: string): Promise<Resume> {
  const response = await apiClient.get<ApiSuccessResponse<Resume>>(`/resumes/${resumeId}`);
  return response.data.data;
}

export async function updateResume(resumeId: string, input: UpdateResumeRequest): Promise<Resume> {
  const response = await apiClient.patch<ApiSuccessResponse<Resume>>(`/resumes/${resumeId}`, input);
  return response.data.data;
}

export async function deleteResume(resumeId: string): Promise<void> {
  await apiClient.delete(`/resumes/${resumeId}`);
}
