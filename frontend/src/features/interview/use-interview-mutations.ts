'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as interviewService from '@/services/interview.service';
import { useToastStore } from '@/stores/toast.store';
import { normalizeApiError } from '@/utils/api-error';

export function useGenerateQuestionsMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: interviewService.generateQuestions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      pushToast({ title: 'Questions generated', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to generate questions', description: normalized.message, variant: 'error' });
    },
  });
}
