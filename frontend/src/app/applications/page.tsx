'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
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

const COLUMNS = ['SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'REJECTED'] as const;
type Status = typeof COLUMNS[number];

const statusStyles: Record<Status, string> = {
  SUBMITTED: 'bg-slate-100/50 dark:bg-slate-800/30 border-border',
  REVIEWED: 'bg-slate-100/50 dark:bg-slate-800/30 border-border',
  SHORTLISTED: 'bg-slate-100/50 dark:bg-slate-800/30 border-border',
  REJECTED: 'bg-slate-100/50 dark:bg-slate-800/30 border-border',
};

const badgeStyles: Record<Status, string> = {
  SUBMITTED: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  REVIEWED: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  SHORTLISTED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
};

export default function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateStatus = useUpdateApplicationStatusMutation();
  const queryClient = useQueryClient();
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    return applicationService.listApplications({ page, limit: 100 }); // High limit for kanban
  }, [page]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['applications', page],
    queryFn: fetchApplications,
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Slight delay to allow CSS styling of dragged element
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedAppId(null);
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    if (!appId) return;

    const currentApps = data?.items ?? [];
    const app = currentApps.find(a => a.id === appId);
    if (!app || app.status === newStatus) return;

    // Optimistic update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryClient.setQueryData(['applications', page], (old: { items: any[]; totalPages: number; page: number } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) => 
          item.id === appId ? { ...item, status: newStatus } : item
        )
      };
    });

    updateStatus.mutate({ id: appId, status: newStatus }, {
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ['applications'] });
      }
    });
  };

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

  const items = data?.items ?? [];
  const isRecruiter = user?.role === 'RECRUITER';

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Applications"
          title={isRecruiter ? 'Application Pipeline' : 'Your applications'}
          description={isRecruiter ? 'Drag and drop applications to update their status seamlessly' : 'Track your job applications'}
        >
          {items.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-12 text-center text-sm text-muted flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{isRecruiter ? 'No applications in the pipeline yet.' : 'No applications yet. Browse jobs and apply with your resume.'}</span>
            </div>
          ) : isRecruiter ? (
            // Kanban Board
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 h-[calc(100vh-280px)] min-h-[500px]">
              {COLUMNS.map((col) => {
                const colItems = items.filter(i => i.status === col);
                return (
                  <div
                    key={col}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col)}
                    className={`flex flex-col rounded-2xl border ${statusStyles[col]} p-4 transition-colors duration-200`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground tracking-wide text-sm">{col.charAt(0) + col.slice(1).toLowerCase()}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeStyles[col]}`}>
                        {colItems.length}
                      </span>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                      {colItems.map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onDragEnd={handleDragEnd}
                          className={`group cursor-grab active:cursor-grabbing rounded-xl border border-border bg-surface p-4 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 ${draggedAppId === app.id ? 'opacity-50 scale-95' : ''}`}
                        >
                          <h4 className="font-semibold text-foreground text-sm mb-1 leading-tight line-clamp-2">
                            {app.jobPosting?.title ?? 'Unknown Position'}
                          </h4>
                          <p className="text-xs text-muted mb-3 line-clamp-1">
                            {app.resume?.title ?? 'Unknown Resume'}
                          </p>
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                            <span className="text-[10px] text-muted font-medium">
                              {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <a
                              href={`${appEnv.apiBaseUrl}/applications/${app.id}/resume/file?download=true&token=${accessToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              RESUME
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Student List View
            <div className="space-y-4">
              {items.map((app) => (
                <div key={app.id} className="rounded-xl border border-border bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {app.jobPosting?.title ?? 'Unknown Position'}
                      </h3>
                      <p className="mt-1 text-sm text-muted flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {app.resume?.title ?? 'Unknown Resume'}
                        <span className="mx-1">&bull;</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeStyles[app.status as Status] ?? ''}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}

              {data?.totalPages && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6 border-t border-border">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors">Previous</button>
                  <span className="text-sm font-medium text-muted">Page {data?.page} of {data?.totalPages}</span>
                  <button type="button" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors">Next</button>
                </div>
              )}
            </div>
          )}
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
