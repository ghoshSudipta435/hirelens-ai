'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { ToastViewport } from '@/components/feedback/toast-viewport';
import { performRefresh } from '@/lib/api/http-client';
import { useAuthStore } from '@/stores/auth.store';

type AppProvidersProps = Readonly<{
  children: ReactNode;
}>;

function SessionBootstrap() {
  const status = useAuthStore((s) => s.status);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    if (status !== 'bootstrapping') return;

    performRefresh()
      .then((session) => setSession(session))
      .catch(() => clearSession());
  }, [status, setSession, clearSession]);

  return null;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap />
        {children}
        <ToastViewport />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
