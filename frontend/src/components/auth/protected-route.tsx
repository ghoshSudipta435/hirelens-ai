'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { LoadingState } from '@/components/feedback/loading-state';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types/auth';

type ProtectedRouteProps = Readonly<{
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}>;

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { status, user } = useAuthStore();

  useEffect(() => {
    if (status === 'bootstrapping') return;

    if (status !== 'authenticated' || !user) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/');
    }
  }, [status, user, allowedRoles, redirectTo, router]);

  if (status === 'bootstrapping' || status !== 'authenticated' || !user) {
    return <LoadingState label="Checking access" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <LoadingState label="Checking access" />;
  }

  return children;
}
