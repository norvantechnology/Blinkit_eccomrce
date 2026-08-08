'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/admin/auth/forgot-password', { email });
      setMessage(data.message);
      const resetUrl = data?.data?.resetUrl as string | undefined;
      if (resetUrl) {
        setMessage(`${data.message} Dev reset link is ready below.`);
        setDevResetUrl(resetUrl);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/admin/auth/reset-password', {
        token: resetToken,
        password,
      });
      setMessage(data.message);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={resetToken ? 'Set new password' : 'Reset password'}
      description={
        resetToken
          ? 'Choose a strong password for your account.'
          : "Enter your email and we'll send a reset link if it exists."
      }
    >
      {message && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
          {devResetUrl && (
            <p className="mt-2 break-all">
              <a href={devResetUrl} className="font-semibold underline">
                Open reset link
              </a>
            </p>
          )}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {resetToken ? (
        <form onSubmit={handleReset} className="space-y-4">
          <Input
            id="password"
            label="New password"
            type="password"
            name="new-password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" aria-hidden />}
          />
          <Input
            id="confirm"
            label="Confirm password"
            type="password"
            name="confirm-password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" aria-hidden />}
          />
          <Button type="submit" size="lg" loading={loading} disabled={loading} className="w-full">
            Reset password
          </Button>
        </form>
      ) : (
        <form onSubmit={handleForgot} className="space-y-4">
          <Input
            id="email"
            label="Email address"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            leftIcon={<Mail className="h-4 w-4" aria-hidden />}
          />
          <Button type="submit" size="lg" loading={loading} disabled={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 transition hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
