import type { ReactNode } from 'react';

type AuthCardProps = Readonly<{
  title: string;
  description: string;
  children: ReactNode;
}>;

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          HireLens AI
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
