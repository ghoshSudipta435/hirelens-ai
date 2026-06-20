import { AuthCard } from '@/components/auth/auth-card';
import { PublicRoute } from '@/components/auth/public-route';
import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <PublicRoute>
      <AuthCard
        title="Sign in"
        description="Access your screening workspace and continue your hiring or interview preparation flow."
      >
        <LoginForm />
      </AuthCard>
    </PublicRoute>
  );
}
