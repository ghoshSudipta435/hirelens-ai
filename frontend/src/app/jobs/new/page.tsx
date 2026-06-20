import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { JobForm } from '@/features/jobs/job-form';

export default function NewJobPage() {
  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <AppShell>
        <PageShell
          eyebrow="Jobs"
          title="Create job posting"
          description="Post a new position to find the right candidate"
        >
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <JobForm />
          </div>
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
