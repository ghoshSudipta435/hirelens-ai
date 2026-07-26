import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
