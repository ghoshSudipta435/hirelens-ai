import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">404</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
