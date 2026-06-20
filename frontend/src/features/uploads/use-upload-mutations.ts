'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as uploadService from '@/services/upload.service';
import { useToastStore } from '@/stores/toast.store';
import { normalizeApiError } from '@/utils/api-error';

export function useUploadFileMutation() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: uploadService.uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      pushToast({ title: 'File uploaded', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Upload failed', description: normalized.message, variant: 'error' });
    },
  });
}
