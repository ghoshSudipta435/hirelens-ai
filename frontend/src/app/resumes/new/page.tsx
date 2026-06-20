'use client';

import { useRouter } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { ResumeCreateForm } from '@/features/resumes/resume-create-form';

export default function NewResumePage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Resumes"
          title="Create resume"
          description="Upload a PDF and create a new resume entry"
        >
          <ResumeCreateForm onSuccess={(id) => router.push(`/resumes`)} />
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
