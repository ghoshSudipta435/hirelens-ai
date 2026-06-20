'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { LoadingState } from '@/components/feedback/loading-state';
import { useAuthStore } from '@/stores/auth.store';

type PublicRouteProps = Readonly<{
  children: ReactNode;
}>;

export function PublicRoute({ children }: PublicRouteProps) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [router, status]);

  if (status === 'authenticated') {
    return <LoadingState label="Redirecting" />;
  }

  return children;
}
