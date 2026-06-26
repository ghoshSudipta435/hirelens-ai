'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { useCurrentProfileQuery } from '@/features/profile/use-profile-mutations';
import { useLoginMutation } from '@/features/auth/use-auth-mutations';
import { loginFormSchema, type LoginFormValues } from '@/features/auth/auth.schemas';
import { isProfileComplete } from '@/utils/profile-completion';

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const profileQuery = useCurrentProfileQuery(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
      const profile = await profileQuery.refetch();
      router.replace(profile.data && isProfileComplete(profile.data) ? '/dashboard' : '/complete-profile');
    } catch {
      // Mutation onError already shows toast
    }
  });

  return (
    <form className="space-y-5" noValidate onSubmit={onSubmit}>
      <Field
        autoComplete="email"
        error={errors.email}
        id="email"
        label="Email"
        registration={register('email')}
        type="email"
      />
      <Field
        autoComplete="current-password"
        error={errors.password}
        id="password"
        label="Password"
        registration={register('password')}
        type="password"
      />
      <SubmitButton isLoading={loginMutation.isPending}>Sign in</SubmitButton>
      <p className="text-center text-sm text-[var(--muted)]">
        New to HireLens?{' '}
        <Link className="font-semibold text-[var(--accent)]" href="/register">
          Create an account
        </Link>
      </p>
    </form>
  );
}
