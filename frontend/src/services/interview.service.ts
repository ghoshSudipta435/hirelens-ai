import { aiApiClient, apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { InterviewQuestionSet } from '@/types/interview';

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
