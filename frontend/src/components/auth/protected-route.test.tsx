import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from './protected-route';
import { PublicRoute } from './public-route';
import { useAuthStore } from '@/stores/auth.store';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace,
  }),
}));

function setAuthState(status: 'anonymous' | 'authenticated') {
  if (status === 'authenticated') {
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'STUDENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return;
  }

  useAuthStore.getState().clearSession();
}

function TestChild({ children = 'Protected content' }: Readonly<{ children?: ReactNode }>) {
  return <div>{children}</div>;
}

describe('route guards', () => {
  beforeEach(() => {
    replace.mockClear();
    localStorage.clear();
    setAuthState('anonymous');
  });

  it('redirects anonymous users away from protected routes', async () => {
    render(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    setAuthState('authenticated');

    render(
      <ProtectedRoute>
        <TestChild />
      </ProtectedRoute>,
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects authenticated users away from public routes', async () => {
    setAuthState('authenticated');

    render(
      <PublicRoute>
        <TestChild>Public content</TestChild>
      </PublicRoute>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });
});
