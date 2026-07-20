'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import * as applicationService from '@/services/application.service';
import { useAuthStore } from '@/stores/auth.store';
import { useUpdateApplicationStatusMutation } from '@/features/applications/use-application-mutations';
import { appEnv } from '@/config/env';

const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REVIEWED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SHORTLISTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateStatus = useUpdateApplicationStatusMutation();

  const fetchApplications = useCallback(async () => {
    return applicationService.listApplications({ page, limit: 20 });
  }, [page]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['applications', page],
    queryFn: fetchApplications,
  });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <LoadingState label="Loading applications..." />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ErrorState message={error instanceof Error ? error.message : 'Failed to load applications'} />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Applications"
          title={user?.role === 'RECRUITER' ? 'Received applications' : 'Your applications'}
          description={user?.role === 'RECRUITER' ? 'Review and manage candidate applications' : 'Track your job applications'}
        >
          {!data || data.items.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
              {user?.role === 'RECRUITER'
                ? 'No applications received yet.'
                : 'No applications yet. Browse jobs and apply with your resume.'}
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-[var(--foreground)]">
                        {app.jobPosting?.title ?? 'Unknown Position'}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {app.resume?.title ?? 'Unknown Resume'} &middot;{' '}
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {user?.role === 'RECRUITER' ? (
                      <div className="flex items-center gap-3">
                        <a
                          href={`${appEnv.apiBaseUrl}/applications/${app.id}/resume/file?download=true&token=${accessToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10"
                        >
                          View Resume
                        </a>
                        <select
                          value={app.status}
                          onChange={(e) => updateStatus.mutate({ id: app.id, status: e.target.value })}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium outline-none ${statusColors[app.status] ?? ''}`}
                        >
                          <option value="SUBMITTED">Submitted</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[app.status] ?? ''}`}>
                        {app.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-md px-3 py-1.5 text-sm text-[var(--muted)] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[var(--muted)]">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-md px-3 py-1.5 text-sm text-[var(--muted)] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
