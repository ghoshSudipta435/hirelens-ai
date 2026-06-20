'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as profileService from '@/services/profile.service';
import { useToastStore } from '@/stores/toast.store';
import { normalizeApiError } from '@/utils/api-error';

export const profileQueryKey = ['profile', 'current'] as const;

export function useCurrentProfileQuery(enabled = true) {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: profileService.getCurrentProfile,
    enabled,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: profileService.updateCurrentProfile,
    onSuccess: async (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      pushToast({ title: 'Profile completed', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({
        title: 'Profile update failed',
        description: normalized.message,
        variant: 'error',
      });
    },
  });
}
