'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { useCurrentProfileQuery } from '@/features/profile/use-profile-mutations';
import * as matchingService from '@/services/matching.service';

export default function MatchesPage() {
  const [page, setPage] = useState(1);
  const { data: profile } = useCurrentProfileQuery();

  const fetchMatches = useCallback(async () => {
    return matchingService.listMatches({ page, limit: 20 });
  }, [page]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['matches', page],
    queryFn: fetchMatches,
  });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <LoadingState label="Loading matches..." />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ErrorState message={error instanceof Error ? error.message : 'Failed to load matches'} />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Matches"
          title="Match results"
          description={profile?.user.role === 'RECRUITER' ? 'See how candidates match your job requirements' : 'See how your resume matches job requirements'}
        >
          {!data || data.items.length === 0 ? (
            profile?.user.role === 'RECRUITER' ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
                <p className="text-sm text-[var(--muted)]">No matches yet</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  Create a job posting to start matching with qualified candidates.
                </p>
                <Link
                  href="/jobs/new"
                  className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Create job posting
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
                <p className="text-sm font-medium text-[var(--foreground)]">No matches yet</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Matches are generated when you click <strong>Preview Match</strong> on a job posting or when you submit an application.
                </p>
                <Link
                  href="/jobs"
                  className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {data.items.map((match) => (
                <div
                  key={match.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-[var(--foreground)]">
                          {profile?.user.role === 'RECRUITER'
                            ? (match.resume?.title ?? 'Unknown Resume')
                            : (match.jobPosting?.title ?? 'Unknown Job')}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            match.score >= 80
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : match.score >= 50
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {match.score}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {profile?.user.role === 'RECRUITER'
                          ? (match.jobPosting?.title ?? 'Unknown Job')
                          : (match.resume?.title ?? 'Unknown Resume')} &middot;{' '}
                        {new Date(match.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {(match.matchedSkills.length > 0 || match.missingSkills.length > 0) && (
                    <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-3">
                      {match.matchedSkills.length > 0 && (
                        <div>
                          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Matched Skills</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchedSkills.slice(0, 6).map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              >
                                {skill}
                              </span>
                            ))}
                            {match.matchedSkills.length > 6 && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                +{match.matchedSkills.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {match.missingSkills.length > 0 && (
                        <div>
                          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Skill Gap</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {match.missingSkills.slice(0, 6).map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              >
                                {skill}
                              </span>
                            ))}
                            {match.missingSkills.length > 6 && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                +{match.missingSkills.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
