'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthSession, AuthUser } from '@/types/auth';

type AuthStatus = 'anonymous' | 'authenticated' | 'bootstrapping';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  setSession: (session: AuthSession) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: 'bootstrapping',
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
          status: 'authenticated',
        }),
      setAccessToken: (accessToken) =>
        set((state) => ({
          accessToken,
          status: state.user ? 'authenticated' : state.status,
        })),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          status: 'anonymous',
        }),
    }),
    {
      name: 'hirelens-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        status: state.status,
      }),
    },
  ),
);
