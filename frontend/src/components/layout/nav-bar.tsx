'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '../ui/theme-toggle';
import { NotificationBell } from '../ui/notification-bell';
import { ProfileMenu } from '../ui/profile-menu';

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
  { href: '/interviews', label: 'Interviews' },
];

export function NavBar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  
  const links = useMemo(() => {
    const baseLinks = user?.role === 'RECRUITER' ? recruiterLinks : studentLinks;
    if (user?.role === 'ADMIN') {
       return [...baseLinks, { href: '/admin', label: 'Admin' }];
    }
    return baseLinks;
  }, [user?.role]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link className="flex items-center gap-2 text-sm font-bold text-foreground" href="/dashboard">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            HireLens
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  pathname.startsWith(link.href)
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>
      {/* Mobile nav (Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/90 backdrop-blur-md px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center rounded-lg px-2 py-1 transition-all duration-200 ${
              pathname.startsWith(link.href)
                ? 'text-accent scale-105'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <span className={`text-[11px] tracking-wide ${pathname.startsWith(link.href) ? 'font-bold' : 'font-medium'}`}>
              {link.label}
            </span>
            {pathname.startsWith(link.href) && (
              <span className="mt-1 block h-1 w-1 rounded-full bg-accent" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
