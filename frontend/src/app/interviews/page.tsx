'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import * as matchingService from '@/services/matching.service';
import { useAuthStore } from '@/stores/auth.store';
import { useGenerateQuestionsMutation } from '@/features/interview/use-interview-mutations';
import * as interviewService from '@/services/interview.service';

export default function InterviewsPage() {
  const [page, setPage] = useState(1);
  const user = useAuthStore((state) => state.user);
  const generateMutation = useGenerateQuestionsMutation();
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    return matchingService.listMatches({ page, limit: 20 });
  }, [page]);

  const { data: matches, isLoading, isError, error } = useQuery({
    queryKey: ['matches', page],
    queryFn: fetchMatches,
  });

  const handleGenerate = useCallback(
    async (matchId: string) => {
      setGeneratingFor(matchId);
      try {
        await generateMutation.mutateAsync(matchId);
      } finally {
        setGeneratingFor(null);
      }
    },
    [generateMutation],
  );

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
          eyebrow="Interviews"
          title="Generate interview questions"
          description="Create AI-powered interview questions based on match results"
        >
          {!matches || matches.items.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
              No matches yet. Preview a match from a job posting to generate questions.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.items.map((match) => (
                <div
                  key={match.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-[var(--foreground)]">
                          {match.jobPosting?.title ?? 'Unknown Job'}
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                          {match.score}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {match.resume?.title ?? 'Unknown Resume'}
                      </p>
                    </div>
                    {user?.role === 'RECRUITER' && (
                      <button
                        type="button"
                        onClick={() => handleGenerate(match.id).catch(() => {})}
                        disabled={generatingFor === match.id}
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {generatingFor === match.id ? 'Generating...' : 'Generate Questions'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
