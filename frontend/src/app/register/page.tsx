import { AuthCard } from '@/components/auth/auth-card';
import { PublicRoute } from '@/components/auth/public-route';
import { RegisterForm } from '@/features/auth/register-form';

export default function RegisterPage() {
  return (
    <PublicRoute>
      <AuthCard
        title="Create account"
        description="Choose your role so HireLens can prepare the right onboarding path."
      >
        <RegisterForm />
      </AuthCard>
    </PublicRoute>
  );
}
