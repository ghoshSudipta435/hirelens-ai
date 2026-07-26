'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import * as adminService from '@/services/admin.service';
import { useAuthStore } from '@/stores/auth.store';

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const user = useAuthStore((state) => state.user);

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: adminService.getMetrics,
    enabled: user?.role === 'ADMIN',
  });

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['admin-logs', page],
    queryFn: () => adminService.getAuthLogs({ page, limit: 10 }),
    enabled: user?.role === 'ADMIN',
  });

  // If user is not an admin, deny access visually (even though backend will block them anyway)
  if (user?.role !== 'ADMIN') {
    return (
      <ProtectedRoute>
        <AppShell>
          <ErrorState message="You do not have permission to view the Admin Dashboard." />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Dashboard"
          title="Admin Metrics"
          description="System overview and security audit logs"
        >
          {isLoadingMetrics ? (
            <LoadingState label="Loading metrics..." />
          ) : metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users', value: metrics.totalUsers, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                { label: 'Total Resumes', value: metrics.totalResumes, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { label: 'Active Jobs', value: metrics.totalJobs, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                { label: 'Applications', value: metrics.totalApplications, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-background/50">
              <h3 className="font-semibold text-foreground">Security & Audit Logs</h3>
            </div>
            
            {isLoadingLogs ? (
              <div className="p-8">
                <LoadingState label="Loading audit logs..." />
              </div>
            ) : !logs || logs.items.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No audit logs found.</div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-background text-muted">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Event</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold">User</th>
                        <th className="px-6 py-3 font-semibold">IP Address</th>
                        <th className="px-6 py-3 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {logs.items.map((log) => (
                        <tr key={log.id} className="hover:bg-background/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-accent/10 text-accent px-2 py-1 rounded-md">
                              {log.eventType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {log.success ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Failed
                              </span>
                            )}
                            {log.reason && <p className="text-[10px] text-muted mt-1 ml-1">{log.reason}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-foreground">{log.user?.email || log.email || 'Unknown'}</p>
                            <p className="text-[10px] text-muted">{log.userId}</p>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted">{log.ipAddress || '-'}</td>
                          <td className="px-6 py-4 text-muted">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {logs.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/30">
                    <span className="text-sm font-medium text-muted">Page {logs.page} of {logs.totalPages}</span>
                    <div className="flex gap-2">
                      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors bg-surface">Previous</button>
                      <button disabled={page >= logs.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors bg-surface">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
