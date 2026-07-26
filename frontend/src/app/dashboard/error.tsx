'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Dashboard Error</h2>
        <p className="mt-2 text-sm text-muted">
          {error.message || 'Failed to load dashboard data.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
