'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { useAuthStore } from '@/stores/auth.store';
import { useLogoutMutation } from '@/features/auth/use-auth-mutations';

const studentLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/resumes', label: 'Resumes' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/applications', label: 'Applications' },
  { href: '/matches', label: 'Matches' },
];

const recruiterLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/applications', label: 'Applications' },
];

export function NavBar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();
  const links = useMemo(() => (user?.role === 'RECRUITER' ? recruiterLinks : studentLinks), [user?.role]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/80 backdrop-blur-md dark:bg-[var(--background)]/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link className="text-sm font-bold text-[var(--foreground)]" href="/dashboard">
            HireLens
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  pathname.startsWith(link.href)
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[var(--muted)] sm:block">
            {user?.name}
          </span>
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-red-500"
          >
            Sign out
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="flex gap-2 overflow-x-auto border-t border-[var(--border)] px-4 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ${
              pathname.startsWith(link.href)
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-[var(--muted)]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
