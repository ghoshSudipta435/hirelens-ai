'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import * as jobService from '@/services/job.service';
import * as resumeService from '@/services/resume.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';
import { useCreateApplicationMutation } from '@/features/applications/use-application-mutations';
import { useDeleteJobMutation } from '@/features/jobs/use-job-mutations';
import { usePreviewMatchMutation } from '@/features/matching/use-matching-mutations';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const deleteMutation = useDeleteJobMutation();
  const createApplication = useCreateApplicationMutation();
  const previewMatch = usePreviewMatchMutation();
  const pushToast = useToastStore((state) => state.pushToast);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchJob = useCallback(async () => {
    return jobService.getJob(params.id as string);
  }, [params.id]);

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: ['job', params.id],
    queryFn: fetchJob,
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.listResumes(),
    enabled: user?.role === 'STUDENT',
  });

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(params.id as string);
    router.push('/jobs');
  }, [deleteMutation, params.id, router]);

  const handleApply = useCallback(async () => {
    if (!selectedResumeId) {
      pushToast({ title: 'Select a resume first', variant: 'warning' });
      return;
    }
    await createApplication.mutateAsync({ resumeId: selectedResumeId, jobPostingId: params.id as string });
  }, [selectedResumeId, params.id, createApplication, pushToast]);

  const handlePreviewMatch = useCallback(async () => {
    if (!selectedResumeId) {
      pushToast({ title: 'Select a resume first', variant: 'warning' });
      return;
    }
    await previewMatch.mutateAsync({ resumeId: selectedResumeId, jobPostingId: params.id as string });
  }, [selectedResumeId, params.id, previewMatch, pushToast]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <LoadingState label="Loading job..." />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError || !job) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ErrorState message={error instanceof Error ? error.message : 'Job not found'} />
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isOwner = user?.role === 'RECRUITER' && job.recruiterId === user.id;

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell eyebrow={job.employmentType.replace('_', ' ')} title={job.title}>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                {job.locationMode}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  job.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
              >
                {job.status}
              </span>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">{job.description}</p>
            </div>

            {job.extractedSkills && job.extractedSkills.length > 0 && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.extractedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.recruiter && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Posted by</h2>
                <p className="text-sm text-[var(--muted)]">{job.recruiter.name} &middot; {job.recruiter.email}</p>
              </div>
            )}

            {user?.role === 'STUDENT' && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Actions</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)]" htmlFor="resume-select">
                      Select Resume
                    </label>
                    <select
                      id="resume-select"
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    >
                      <option value="">Choose a resume...</option>
                      {resumes?.items?.filter((r) => r.status === 'ACTIVE').map((r) => (
                        <option key={r.id} value={r.id}>{r.title} v{r.version}</option>
                      ))}
                    </select>
                    {(!resumes?.items || resumes.items.length === 0) && (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        No resumes yet.{' '}
                        <Link href="/resumes/new" className="text-[var(--accent)] underline">Create one</Link>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApply().catch(() => {})}
                      disabled={!selectedResumeId || createApplication.isPending}
                      className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {createApplication.isPending ? 'Applying...' : 'Apply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewMatch().catch(() => {})}
                      disabled={!selectedResumeId || previewMatch.isPending}
                      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50"
                    >
                      {previewMatch.isPending ? 'Matching...' : 'Preview Match'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="flex gap-3">
                <Link
                  href={`/jobs/${params.id}/edit`}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete Job
                </button>
              </div>
            )}
          </div>
        </PageShell>

        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete job"
          message="Are you sure you want to delete this job posting? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            setShowDeleteConfirm(false);
            handleDeleteConfirm().catch(() => {});
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
