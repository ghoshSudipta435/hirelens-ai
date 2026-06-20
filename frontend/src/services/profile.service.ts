import { apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { ProfileFormValues, ProfileResponse } from '@/types/profile';

export async function getCurrentProfile(): Promise<ProfileResponse> {
  const response = await apiClient.get<ApiSuccessResponse<ProfileResponse>>('/profile');
  return response.data.data;
}

export async function updateCurrentProfile(input: ProfileFormValues): Promise<ProfileResponse> {
  const response = await apiClient.patch<ApiSuccessResponse<ProfileResponse>>('/profile', input);
  return response.data.data;
}
