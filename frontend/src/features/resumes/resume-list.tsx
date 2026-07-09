'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { appEnv } from '@/config/env';
import * as resumeService from '@/services/resume.service';
import { useToastStore } from '@/stores/toast.store';
import type { Resume } from '@/types/resume';
import { useDeleteResumeMutation } from './use-resume-mutations';

export function ResumeList() {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteResumeMutation();
  const pushToast = useToastStore((state) => state.pushToast);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => resumeService.listResumes(), []);

  const { data: paginated, isLoading, isError, error } = useQuery({
    queryKey: ['resumes'],
    queryFn: fetchResumes,
  });

  const handleActivate = useCallback(
    async (resume: Resume) => {
      try {
        await resumeService.updateResume(resume.id, { status: 'ACTIVE' });
        queryClient.invalidateQueries({ queryKey: ['resumes'] });
        pushToast({ title: 'Resume activated', variant: 'success' });
      } catch (err) {
        pushToast({
          title: 'Failed to activate resume',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'error',
        });
      }
    },
    [queryClient, pushToast],
  );

  const handleDelete = useCallback(
    (resumeId: string) => {
      setDeleteTarget(resumeId);
    },
    [],
  );

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteMutation]);

  if (isLoading) {
    return <LoadingState label="Loading resumes..." />;
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : 'Failed to load resumes'} />;
  }

  const resumes = paginated?.items ?? [];

  if (resumes.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
        No resumes yet. Upload your first resume to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[var(--foreground)]">{resume.title}</h3>
              {resume.status === 'ACTIVE' && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Active
                </span>
              )}
              {resume.status === 'DRAFT' && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Draft
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Version {resume.version} &middot; {new Date(resume.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {resume.fileUrl && (
              <a
                href={`${appEnv.apiBaseUrl}/resumes/${resume.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10"
              >
                View
              </a>
            )}
            {resume.status !== 'ACTIVE' && (
              <button
                type="button"
                onClick={() => handleActivate(resume)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10"
              >
                Activate
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(resume.id)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete resume"
        message="Are you sure you want to delete this resume? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
