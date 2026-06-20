'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { JobEditForm } from '@/features/jobs/job-edit-form';
import * as jobService from '@/services/job.service';

export default function EditJobPage() {
  const params = useParams();

  const fetchJob = useCallback(async () => {
    return jobService.getJob(params.id as string);
  }, [params.id]);

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: ['job', params.id],
    queryFn: fetchJob,
  });

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['RECRUITER']}>
        <AppShell>
          <LoadingState label="Loading job..." />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError || !job) {
    return (
      <ProtectedRoute allowedRoles={['RECRUITER']}>
        <AppShell>
          <ErrorState message={error instanceof Error ? error.message : 'Job not found'} />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      <AppShell>
        <PageShell
          eyebrow="Jobs"
          title="Edit job posting"
          description={job.title}
        >
          <JobEditForm job={job} />
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
