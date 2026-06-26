import { aiApiClient, apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { InterviewQuestionSet } from '@/types/interview';
import type { PaginatedResponse } from '@/types/job';

export async function generateQuestions(matchResultId: string): Promise<InterviewQuestionSet> {
  const response = await aiApiClient.post<ApiSuccessResponse<InterviewQuestionSet>>('/interviews/generate', {
    matchResultId,
  });
  return response.data.data;
}

export async function getQuestionSet(questionSetId: string): Promise<InterviewQuestionSet> {
  const response = await apiClient.get<ApiSuccessResponse<InterviewQuestionSet>>(`/interviews/${questionSetId}`);
  return response.data.data;
}

export async function listQuestionSets(query?: { page?: number; limit?: number }): Promise<PaginatedResponse<InterviewQuestionSet>> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResponse<InterviewQuestionSet>>>(`/interviews${qs ? `?${qs}` : ''}`);
  return response.data.data;
}
