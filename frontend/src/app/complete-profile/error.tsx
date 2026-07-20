'use client';

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
