'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as resumeService from '@/services/resume.service';
import { useToastStore } from '@/stores/toast.store';
import { normalizeApiError } from '@/utils/api-error';

export function useCreateResumeMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: resumeService.createResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      pushToast({ title: 'Resume created', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to create resume', description: normalized.message, variant: 'error' });
    },
  });
}

export function useListResumesQuery() {
  const queryKey = ['resumes'];

  const query = async () => resumeService.listResumes();

  return { queryKey, query };
}

export function useUpdateResumeMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & import('@/types/resume').UpdateResumeRequest) =>
      resumeService.updateResume(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      pushToast({ title: 'Resume updated', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to update resume', description: normalized.message, variant: 'error' });
    },
  });
}

export function useDeleteResumeMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: resumeService.deleteResume,
    onMutate: async (resumeId) => {
      await queryClient.cancelQueries({ queryKey: ['resumes'] });
      const previous = queryClient.getQueryData<{ items: Array<{ id: string }> }>(['resumes']);
      if (previous) {
        queryClient.setQueryData(['resumes'], {
          ...previous,
          items: previous.items.filter((r) => r.id !== resumeId),
        });
      }
      return { previous };
    },
    onError: (error, _resumeId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['resumes'], context.previous);
      }
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Failed to delete resume', description: normalized.message, variant: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}
