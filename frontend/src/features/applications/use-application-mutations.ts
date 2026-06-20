'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as applicationService from '@/services/application.service';
import { useToastStore } from '@/stores/toast.store';
import { normalizeApiError } from '@/utils/api-error';

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: applicationService.createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      pushToast({ title: 'Application submitted', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to apply', description: normalized.message, variant: 'error' });
    },
  });
}

export function useUpdateApplicationStatusMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      applicationService.updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      pushToast({ title: 'Status updated', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to update status', description: normalized.message, variant: 'error' });
    },
  });
}
