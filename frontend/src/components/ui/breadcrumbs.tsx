'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  crumbs: Crumb[];
};

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  const router = useRouter();

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <li>
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-1 rounded px-1.5 py-0.5 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
            aria-label="Go back"
          >
            &larr;
          </button>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="rounded px-1.5 py-0.5 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-[var(--foreground)]' : ''} aria-current={isLast ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
