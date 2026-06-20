import React from 'react';

type LoadingStateProps = Readonly<{
  label?: string;
}>;

export function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-[var(--muted)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      <span>{label}</span>
    </div>
  );
}
