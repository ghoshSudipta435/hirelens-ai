'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';
import { normalizeApiError } from '@/utils/api-error';

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (session) => {
      setSession(session);
      pushToast({ title: 'Signed in', variant: 'success' });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({ title: 'Login failed', description: normalized.message, variant: 'error' });
    },
  });
}

export function useRegisterMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  const pushToast = useToastStore((state) => state.pushToast);

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (session) => {
      setSession(session);
      pushToast({
        title: 'Account created',
        description: 'Welcome to HireLens AI!',
        variant: 'success',
      });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      pushToast({
        title: 'Registration failed',
        description: normalized.message,
        variant: 'error',
      });
    },
  });
}

export function useLogoutMutation() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      clearSession();
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}
