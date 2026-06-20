'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as matchingService from '@/services/matching.service';
import { useToastStore } from '@/stores/toast.store';
import { normalizeApiError } from '@/utils/api-error';

export function usePreviewMatchMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: matchingService.previewMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      pushToast({ title: 'Match complete', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Match failed', description: normalized.message, variant: 'error' });
    },
  });
}
