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
          description="See how your resume matches job requirements"
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
                <p className="text-sm text-[var(--muted)]">No matches yet</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  Upload your resume to discover matching job opportunities.
                </p>
                <Link
                  href="/resumes"
                  className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Upload resume
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
                          {match.jobPosting?.title ?? 'Unknown Job'}
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
                        {match.resume?.title ?? 'Unknown Resume'} &middot;{' '}
                        {new Date(match.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Matched Skills */}
                  {match.matchedSkills.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-[var(--muted)]">Matched Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {match.matchedSkills.slice(0, 8).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skill Gap (Missing Skills) */}
                  {match.missingSkills.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-[var(--muted)]">Skill Gap</p>
                      <div className="flex flex-wrap gap-1">
                        {match.missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {match.strengths.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-[var(--muted)]">Strengths</p>
                      <ul className="space-y-0.5">
                        {match.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-[var(--foreground)]">
                            &bull; {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements Needed */}
                  {match.improvements.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-[var(--muted)]">Improvements Needed</p>
                      <ul className="space-y-0.5">
                        {match.improvements.map((imp, i) => (
                          <li key={i} className="text-xs text-[var(--foreground)]">
                            &bull; {imp}
                          </li>
                        ))}
                      </ul>
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
