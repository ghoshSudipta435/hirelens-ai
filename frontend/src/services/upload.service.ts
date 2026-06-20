import { apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { UploadedFile } from '@/types/upload';

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiSuccessResponse<UploadedFile>>('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function listUploads(page = 1, limit = 20): Promise<{ items: UploadedFile[]; total: number; page: number; limit: number; totalPages: number }> {
  const response = await apiClient.get<ApiSuccessResponse<{ items: UploadedFile[]; total: number; page: number; limit: number; totalPages: number }>>(`/uploads?page=${page}&limit=${limit}`);
  return response.data.data;
}

export async function deleteUpload(uploadId: string): Promise<void> {
  await apiClient.delete(`/uploads/${uploadId}`);
}
