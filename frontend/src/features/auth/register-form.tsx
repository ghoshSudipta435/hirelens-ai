'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { registerFormSchema, type RegisterFormValues } from '@/features/auth/auth.schemas';
import { useRegisterMutation } from '@/features/auth/use-auth-mutations';

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
    },
  });
  const selectedRole = watch('role');

  const onSubmit = handleSubmit(async ({ confirmPassword, ...values }) => {
    void confirmPassword;
    try {
      await registerMutation.mutateAsync(values);
      router.replace('/complete-profile');
    } catch {
      // Mutation onError already shows toast
    }
  });

  return (
    <form className="space-y-5" noValidate onSubmit={onSubmit}>
      <Field
        autoComplete="name"
        error={errors.name}
        id="name"
        label="Name"
        registration={register('name')}
      />
      <Field
        autoComplete="email"
        error={errors.email}
        id="email"
        label="Email"
        registration={register('email')}
        type="email"
      />
      <fieldset>
        <legend className="text-sm font-medium text-[var(--foreground)]">Role</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(['STUDENT', 'RECRUITER'] as const).map((role) => (
            <label
              className={`rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                selectedRole === role
                  ? 'border-[var(--accent)] bg-teal-50 text-teal-950'
                  : 'border-[var(--border)] bg-white text-[var(--muted)]'
              }`}
              key={role}
            >
              <input className="sr-only" type="radio" value={role} {...register('role')} />
              {role === 'STUDENT' ? 'Student' : 'Recruiter'}
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        autoComplete="new-password"
        error={errors.password}
        hint="Use uppercase, lowercase, number, and special character."
        id="password"
        label="Password"
        registration={register('password')}
        type="password"
      />
      <Field
        autoComplete="new-password"
        error={errors.confirmPassword}
        id="confirmPassword"
        label="Confirm Password"
        registration={register('confirmPassword')}
        type="password"
      />
      <SubmitButton isLoading={registerMutation.isPending}>Create account</SubmitButton>
      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{' '}
        <Link className="font-semibold text-[var(--accent)]" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
