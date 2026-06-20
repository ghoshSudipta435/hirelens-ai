import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { PageShell } from '@/components/layout/page-shell';
import { CompleteProfileForm } from '@/features/profile/complete-profile-form';

export default function CompleteProfilePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PageShell
          eyebrow="Onboarding"
          title="Complete your profile"
          description="Add the core details needed to personalize your HireLens workspace."
        >
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            <CompleteProfileForm />
          </section>
        </PageShell>
      </AppShell>
    </ProtectedRoute>
  );
}
