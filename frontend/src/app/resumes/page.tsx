import Link from 'next/link';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { ResumeList } from '@/features/resumes/resume-list';

export default function ResumesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Resumes"
          title="Your resumes"
          description="Manage your uploaded resumes"
        >
          <div className="mb-6 flex justify-end">
            <Link
              href="/resumes/new"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Create Resume
            </Link>
          </div>
          <ResumeList />
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
