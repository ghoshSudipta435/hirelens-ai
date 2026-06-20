import Link from 'next/link';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { JobList } from '@/features/jobs/job-list';

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Jobs"
          title="Job postings"
          description="Browse available positions"
        >
          <div className="mb-6 flex justify-end">
            <Link
              href="/jobs/new"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Create Job
            </Link>
          </div>
          <JobList />
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
