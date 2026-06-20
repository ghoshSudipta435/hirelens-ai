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
      className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>
        {count !== undefined && (
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${accent}`}>{count}</span>
        )}
      </div>
    </Link>
  );
}

function StudentDashboard() {
  const fetchResumes = useCallback(async () => resumeService.listResumes(), []);
  const fetchApplications = useCallback(async () => applicationService.listApplications({ limit: 1 }), []);
  const fetchMatches = useCallback(async () => matchingService.listMatches({ limit: 1 }), []);

  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: fetchResumes });
  const { data: applications } = useQuery({ queryKey: ['applications-dash'], queryFn: fetchApplications });
  const { data: matches } = useQuery({ queryKey: ['matches-dash'], queryFn: fetchMatches });

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
    </div>
  );
}

function RecruiterDashboard() {
  const fetchJobs = useCallback(async () => jobService.listJobs({ limit: 1 }), []);

  const { data: jobs } = useQuery({ queryKey: ['jobs-dash'], queryFn: fetchJobs });

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
          {user?.role === 'STUDENT' ? <StudentDashboard /> : <RecruiterDashboard />}
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
