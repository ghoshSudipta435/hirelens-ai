import { apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { CreateJobRequest, JobListQuery, JobPosting, PaginatedResponse, UpdateJobRequest } from '@/types/job';

export async function createJob(input: CreateJobRequest): Promise<JobPosting> {
  const response = await apiClient.post<ApiSuccessResponse<JobPosting>>('/jobs', input);
  return response.data.data;
}

export async function listJobs(query?: JobListQuery): Promise<PaginatedResponse<JobPosting>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResponse<JobPosting>>>('/jobs', {
    params: query,
  });
  return response.data.data;
}

export async function getJob(jobId: string): Promise<JobPosting> {
  const response = await apiClient.get<ApiSuccessResponse<JobPosting>>(`/jobs/${jobId}`);
  return response.data.data;
}

export async function updateJob(jobId: string, input: UpdateJobRequest): Promise<JobPosting> {
  const response = await apiClient.patch<ApiSuccessResponse<JobPosting>>(`/jobs/${jobId}`, input);
  return response.data.data;
}

export async function deleteJob(jobId: string): Promise<void> {
  await apiClient.delete(`/jobs/${jobId}`);
}
