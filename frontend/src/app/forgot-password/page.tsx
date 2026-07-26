'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AuthCard } from '@/components/auth/auth-card';
import { PublicRoute } from '@/components/auth/public-route';
import { SubmitButton } from '@/components/forms/submit-button';
import { useToastStore } from '@/stores/toast.store';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const pushToast = useToastStore((state) => state.pushToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSent(true);
      pushToast({ title: 'Reset link sent!', variant: 'success' });
    } catch {
      pushToast({ title: 'Failed to send reset link', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicRoute>
      <AuthCard
        title="Reset Password"
        description="Enter your email address and we will send you a link to reset your password."
      >
        {isSent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-medium text-foreground">Check your inbox</h3>
            <p className="text-sm text-muted">We&apos;ve sent a password reset link to {email}.</p>
            <div className="pt-4">
              <Link href="/login" className="text-sm font-medium text-accent hover:underline">
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-medium text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
            <SubmitButton isLoading={isLoading}>Send Reset Link</SubmitButton>
            
            <div className="text-center mt-2">
              <Link href="/login" className="text-sm text-muted hover:text-foreground transition-colors">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </AuthCard>
    </PublicRoute>
  );
}
