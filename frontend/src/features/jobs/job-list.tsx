'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import * as jobService from '@/services/job.service';
import { useAuthStore } from '@/stores/auth.store';
import { useDeleteJobMutation } from './use-job-mutations';

export function JobList() {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const deleteMutation = useDeleteJobMutation();

  const fetchJobs = useCallback(async () => {
    return jobService.listJobs({ page, limit: 20 });
  }, [page]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['jobs', page],
    queryFn: fetchJobs,
  });

  if (isLoading) {
    return <LoadingState label="Loading jobs..." />;
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : 'Failed to load jobs'} />;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
        {user?.role === 'RECRUITER'
          ? 'No job postings yet. Create your first posting to find candidates.'
          : 'No job postings available right now.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((job) => (
        <Link
          key={job.id}
          href={`/jobs/${job.id}`}
          className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-[var(--foreground)]">{job.title}</h3>
                {job.status === 'ACTIVE' && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Active
                  </span>
                )}
                {job.status === 'DRAFT' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Draft
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {job.employmentType.replace('_', ' ')} &middot; {job.locationMode} &middot;{' '}
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
              {job.recruiter && (
                <p className="mt-0.5 text-xs text-[var(--muted)]">by {job.recruiter.name}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {job.extractedSkills?.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]"
                >
                  {skill}
                </span>
              ))}
              {(job.extractedSkills?.length ?? 0) > 3 && (
                <span className="text-xs text-[var(--muted)]">+{job.extractedSkills!.length - 3}</span>
              )}
            </div>
          </div>
        </Link>
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
  );
}
