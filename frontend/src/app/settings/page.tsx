import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { CompleteProfileForm } from '@/features/profile/complete-profile-form';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Settings"
          title="Profile Settings"
          description="Update your personal information and preferences."
        >
          <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6 max-w-4xl">
            <CompleteProfileForm isSettingsPage={true} />
          </section>
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
