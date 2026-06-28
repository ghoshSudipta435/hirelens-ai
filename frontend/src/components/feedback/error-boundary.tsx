'use client';

import type { ReactNode } from 'react';
import { Component } from 'react';

type ErrorBoundaryProps = Readonly<{
  children: ReactNode;
  fallback?: ReactNode;
}>;

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Refresh page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
