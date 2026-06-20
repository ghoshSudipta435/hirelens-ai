'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { LoadingState } from '@/components/feedback/loading-state';
import { performRefresh } from '@/lib/api/http-client';
import { useAuthStore } from '@/stores/auth.store';

type AuthProviderProps = Readonly<{
  children: ReactNode;
}>;

export function AuthProvider({ children }: AuthProviderProps) {
  const { status, setSession, clearSession } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // If the user is already authenticated (e.g. just logged in and navigated here),
    // skip the refresh call. The login mutation already set valid tokens.
    // This also prevents the React Strict Mode double-mount race condition
    // where two concurrent refresh calls would revoke each other's tokens.
    if (useAuthStore.getState().status !== 'bootstrapping') return;

    performRefresh()
      .then((session) => {
        setSession(session);
      })
      .catch(() => {
        // No valid refresh token cookie — user is anonymous
        clearSession();
      });
  }, [setSession, clearSession]);

  if (status === 'bootstrapping') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <LoadingState label="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}
