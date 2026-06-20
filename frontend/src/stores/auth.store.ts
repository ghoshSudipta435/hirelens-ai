'use client';

import { create } from 'zustand';

import type { AuthSession, AuthUser } from '@/types/auth';

type AuthStatus = 'anonymous' | 'authenticated' | 'bootstrapping';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  setSession: (session: AuthSession) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  status: 'bootstrapping',
  setSession: (session) =>
    set({
      accessToken: session.accessToken,
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
      user: null,
      status: 'anonymous',
    }),
}));
