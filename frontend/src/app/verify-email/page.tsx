'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AuthCard } from '@/components/auth/auth-card';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useToastStore } from '@/stores/toast.store';

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const pushToast = useToastStore((state) => state.pushToast);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      // Simulate API call for email resend
      await new Promise(resolve => setTimeout(resolve, 1000));
      pushToast({ title: 'Verification email resent!', variant: 'success' });
    } catch {
      pushToast({ title: 'Failed to resend email', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AuthCard
        title="Verify your email"
        description="We need to verify your email address before you can continue using HireLens."
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          
          <p className="text-sm leading-relaxed text-muted">
            We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to activate your account.
          </p>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted mb-3">Didn&apos;t receive the email?</p>
            <button 
              className="mt-3 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
              onClick={handleResend}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Sending...
                </>
              ) : 'Resend Verification Email'}
            </button>
          </div>
          
          <div>
            <Link href="/dashboard" className="text-sm text-muted hover:text-foreground transition-colors">
              I&apos;ve already verified my email
            </Link>
          </div>
        </div>
      </AuthCard>
    </ProtectedRoute>
  );
}
