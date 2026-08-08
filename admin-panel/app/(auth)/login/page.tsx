'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, LogIn } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { setSession, getLoginErrorMessage } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState(isDev ? 'admin@gmail.com' : '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!password) {
      next.password = 'Password is required';
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await apiClient.post('/admin/auth/login', {
        email: email.trim(),
        password,
      });
      setSession(data.data.user, data.data.tokens);
      setUser(data.data.user);
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setFormError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome Back"
      description="Sign in to the Tapi Grocery admin panel."
    >
      {formError && (
        <div
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          label="Email address"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((s) => ({ ...s, email: undefined }));
          }}
          placeholder="you@company.com"
          leftIcon={<Mail className="h-4 w-4" aria-hidden />}
          error={fieldErrors.email}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((s) => ({ ...s, password: undefined }));
          }}
          placeholder="Enter your password"
          leftIcon={<Lock className="h-4 w-4" aria-hidden />}
          error={fieldErrors.password}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="rounded-sm text-sm font-medium text-green-700 transition hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={loading}
          className="w-full"
          leftIcon={!loading ? <LogIn className="h-4 w-4" /> : undefined}
          rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {isDev && (
        <p className="mt-5 text-center text-xs text-slate-400">
          Dev only: admin@gmail.com / admin@123
        </p>
      )}
    </AuthShell>
  );
}
