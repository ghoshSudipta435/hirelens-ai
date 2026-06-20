import { aiApiClient, apiClient } from '@/lib/api/http-client';
import type { ApiSuccessResponse } from '@/types/api';
import type { MatchListQuery, MatchResult, PaginatedResponse, PreviewMatchRequest } from '@/types/matching';

export async function previewMatch(input: PreviewMatchRequest): Promise<MatchResult> {
  const response = await aiApiClient.post<ApiSuccessResponse<MatchResult>>('/matches/preview', input);
  return response.data.data;
}

export async function getMatch(matchId: string): Promise<MatchResult> {
  const response = await apiClient.get<ApiSuccessResponse<MatchResult>>(`/matches/${matchId}`);
  return response.data.data;
}

export async function listMatches(query?: MatchListQuery): Promise<PaginatedResponse<MatchResult>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResponse<MatchResult>>>('/matches', {
    params: query,
  });
  return response.data.data;
}
