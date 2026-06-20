'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/components/auth/auth-provider';
import { useRouteFocus } from '@/hooks/useRouteFocus';
import { NavBar } from './nav-bar';
import { SkipLink } from './skip-link';

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  const mainRef = useRouteFocus();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <SkipLink />
        <NavBar />
        <div
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8 outline-none"
        >
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
