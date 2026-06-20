'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as jobService from '@/services/job.service';
import { useToastStore } from '@/stores/toast.store';
import { normalizeApiError } from '@/utils/api-error';

export function useCreateJobMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: jobService.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      pushToast({ title: 'Job created', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to create job', description: normalized.message, variant: 'error' });
    },
  });
}

export function useUpdateJobMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & import('@/types/job').UpdateJobRequest) =>
      jobService.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      pushToast({ title: 'Job updated', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to update job', description: normalized.message, variant: 'error' });
    },
  });
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: jobService.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      pushToast({ title: 'Job deleted', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to delete job', description: normalized.message, variant: 'error' });
    },
  });
}
