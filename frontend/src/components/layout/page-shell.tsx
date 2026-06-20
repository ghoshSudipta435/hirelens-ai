import type { ReactNode } from 'react';

type PageShellProps = Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}>;

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="flex flex-1 flex-col gap-8 py-8">
      <header className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{description}</p>
        ) : null}
      </header>
      {children}
    </main>
  );
}
