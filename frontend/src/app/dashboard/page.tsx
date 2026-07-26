'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import * as applicationService from '@/services/application.service';
import * as jobService from '@/services/job.service';
import * as matchingService from '@/services/matching.service';
import * as resumeService from '@/services/resume.service';
import { useAuthStore } from '@/stores/auth.store';

function DashboardCard({
  title,
  description,
  count,
  href,
  accent,
}: {
  title: string;
  description: string;
  count?: number;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/40"
    >
      <div className="flex flex-col justify-between h-full space-y-4">
        <div>
          <h3 className="font-bold text-foreground text-lg tracking-tight group-hover:text-accent transition-colors duration-200">{title}</h3>
          <p className="mt-2 text-sm text-muted/80 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent/80 group-hover:text-accent transition-colors">
            View Details &rarr;
          </span>
          {count !== undefined && (
            <span className={`inline-flex items-center justify-center min-w-[2rem] rounded-full px-2.5 py-1 text-sm font-bold shadow-sm ${accent}`}>
              {count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const fetchResumes = useCallback(async () => resumeService.listResumes(), []);
  const fetchApplications = useCallback(async () => applicationService.listApplications({ limit: 1 }), []);
  const fetchMatches = useCallback(async () => matchingService.listMatches({ limit: 1 }), []);

  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: fetchResumes, enabled: !!user });
  const { data: applications } = useQuery({ queryKey: ['applications', 1], queryFn: fetchApplications, enabled: !!user });
  const { data: matches } = useQuery({ queryKey: ['matches', 1], queryFn: fetchMatches, enabled: !!user });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardCard
        title="Resumes"
        description="Manage your uploaded resumes"
        count={resumes?.total ?? 0}
        href="/resumes"
        accent="bg-blue-100 text-blue-700"
      />
      <DashboardCard
        title="Jobs"
        description="Browse available positions"
        href="/jobs"
        accent="bg-teal-100 text-teal-700"
      />
      <DashboardCard
        title="Applications"
        description="Track your job applications"
        count={applications?.total ?? 0}
        href="/applications"
        accent="bg-amber-100 text-amber-700"
      />
      <DashboardCard
        title="Match Results"
        description="See how you match job requirements"
        count={matches?.total ?? 0}
        href="/matches"
        accent="bg-emerald-100 text-emerald-700"
      />
      <DashboardCard
        title="Interviews"
        description="Review generated interview questions"
        href="/interviews"
        accent="bg-purple-100 text-purple-700"
      />
    </div>
  );
}

function RecruiterDashboard() {
  const user = useAuthStore((state) => state.user);
  const fetchJobs = useCallback(async () => jobService.listJobs({ limit: 1 }), []);

  const { data: jobs } = useQuery({ queryKey: ['jobs', 1], queryFn: fetchJobs, enabled: !!user });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardCard
        title="Job Postings"
        description="Create and manage job listings"
        count={jobs?.total ?? 0}
        href="/jobs"
        accent="bg-teal-100 text-teal-700"
      />
      <DashboardCard
        title="Applications"
        description="Review candidate applications"
        href="/applications"
        accent="bg-amber-100 text-amber-700"
      />
      <DashboardCard
        title="Interviews"
        description="Generate and view interview questions"
        href="/interviews"
        accent="bg-purple-100 text-purple-700"
      />
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardCard
        title="Admin Panel"
        description="View system metrics and security audit logs"
        href="/admin"
        accent="bg-red-100 text-red-700"
      />
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Dashboard"
          title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'User'}`}
          description="Overview of your HireLens workspace"
        >
          {user?.role === 'STUDENT' ? <StudentDashboard /> : user?.role === 'ADMIN' ? <AdminDashboard /> : <RecruiterDashboard />}
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
