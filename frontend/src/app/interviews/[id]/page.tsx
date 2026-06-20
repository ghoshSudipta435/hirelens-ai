'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import * as interviewService from '@/services/interview.service';

const difficultyColors: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function InterviewDetailPage() {
  const params = useParams();

  const fetchQuestions = useCallback(async () => {
    return interviewService.getQuestionSet(params.id as string);
  }, [params.id]);

  const { data: questionSet, isLoading, isError, error } = useQuery({
    queryKey: ['interview-questions', params.id],
    queryFn: fetchQuestions,
  });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <LoadingState label="Loading questions..." />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (isError || !questionSet) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ErrorState message={error instanceof Error ? error.message : 'Question set not found'} />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Interview Questions"
          title="Generated questions"
          description={`${questionSet.questions.length} questions generated`}
        >
          <div className="space-y-4">
            {questionSet.questions.map((q, i) => (
              <div
                key={q.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--muted)]">Q{i + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                  <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]">
                    {q.category}
                  </span>
                </div>
                <p className="text-sm leading-7 text-[var(--foreground)]">{q.question}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
