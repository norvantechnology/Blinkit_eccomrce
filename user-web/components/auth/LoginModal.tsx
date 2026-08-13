'use client';

import { FormEvent, useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { setSession, getApiErrorMessage, type UserProfile, type AuthTokens } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { formatPhoneForApi, cn } from '@/lib/utils';

type Step = 'phone' | 'email' | 'otp' | 'profile';

interface LoginModalProps {
  redirectTo?: string;
  onCloseHref?: string;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

/** Blinkit-style product mosaic tiles for mobile login hero */
const LOGIN_PRODUCTS = [
  'https://images.unsplash.com/photo-1571771894821-ce9b6d11abb9?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=200&h=200&fit=crop',
];

function LoginMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--brand-yellow)] shadow-sm">
      <span className="text-[15px] font-extrabold lowercase tracking-tight text-[#1f1f1f]">
        tapi
      </span>
    </div>
  );
}

export function LoginModal({ redirectTo = '/account', onCloseHref = '/' }: LoginModalProps) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<Step>('phone');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staticOtpHint, setStaticOtpHint] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const formattedPhone = useMemo(
    () => formatPhoneForApi(phoneDigits),
    [phoneDigits],
  );
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits.replace(/\D/g, ''));

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const finishAuth = (user: UserProfile, tokens: AuthTokens) => {
    setSession(user, tokens);
    setUser(user);
    if (!user.name) {
      setStep('profile');
      return;
    }
    const next =
      redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
    router.replace(next);
  };

  const dismissLogin = () => {
    const next =
      onCloseHref.startsWith('/') && !onCloseHref.startsWith('//') ? onCloseHref : '/';
    router.replace(next);
  };

  const handleChromeBack = () => {
    if (step !== 'phone') {
      setStep('phone');
      setError('');
      return;
    }
    dismissLogin();
  };

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await authService.sendOtp(formattedPhone);
      const payload = data?.data as { staticOtp?: boolean; otp?: string } | undefined;
      setStaticOtpHint(payload?.staticOtp && payload?.otp ? payload.otp : null);
      setStep('otp');
      setOtpDigits(Array(6).fill(''));
      setResendIn(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (e: FormEvent) => {
    e.preventDefault();
    if (!phoneValid || loading) return;
    await sendOtp();
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.loginEmail(email.trim(), password);
      finishAuth(result.user, result.tokens);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured yet (needs GOOGLE_CLIENT_ID).');
      return;
    }
    setError('Google sign-in opens when GOOGLE_CLIENT_ID is set on Amplify. Use phone OTP or email for now.');
  };

  const handleAppleLogin = () => {
    setError('Apple sign-in is deferred (API returns 501 until Milestone later). Use phone OTP or email.');
  };

  const verifyOtp = async (code: string) => {
    if (code.length !== 6 || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await authService.verifyOtp(formattedPhone, code);
      finishAuth(result.user, result.tokens);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid OTP'));
      setOtpDigits(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const focusOtpBox = (index: number) => {
    window.setTimeout(() => {
      const el = otpRefs.current[index];
      if (!el) return;
      el.focus();
      el.select?.();
    }, 0);
  };

  const applyOtpDigits = (next: string[]) => {
    setOtpDigits(next);
    const code = next.join('');
    if (code.length === 6 && next.every(Boolean)) {
      void verifyOtp(code);
    }
  };

  const onOtpChange = (index: number, value: string) => {
    // SMS autofill / paste can dump the full code into one box
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      const next = Array(6)
        .fill('')
        .map((_, i) => digits[i] || '');
      applyOtpDigits(next);
      focusOtpBox(Math.min(digits.length, 5));
      return;
    }

    const digit = digits.slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      const code = next.join('');
      if (code.length === 6 && next.every(Boolean)) {
        window.setTimeout(() => void verifyOtp(code), 0);
      }
      return next;
    });

    if (digit && index < 5) {
      focusOtpBox(index + 1);
    }
  };

  const onOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
        return;
      }
      if (index > 0) {
        e.preventDefault();
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        focusOtpBox(index - 1);
      }
      return;
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusOtpBox(index - 1);
      return;
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      focusOtpBox(index + 1);
      return;
    }

    // Digit keys: write + advance even when onChange is flaky on some mobile browsers
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = e.key;
        const code = next.join('');
        if (code.length === 6 && next.every(Boolean)) {
          window.setTimeout(() => void verifyOtp(code), 0);
        }
        return next;
      });
      if (index < 5) focusOtpBox(index + 1);
    }
  };

  const onOtpPaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const next = Array(6).fill('');
    if (digits.length === 6) {
      for (let i = 0; i < 6; i += 1) next[i] = digits[i];
    } else {
      for (let i = 0; i < digits.length; i += 1) {
        next[Math.min(index + i, 5)] = digits[i];
      }
    }
    applyOtpDigits(next);
    focusOtpBox(Math.min((digits.length === 6 ? digits.length : index + digits.length) - 1, 5));
  };

  const handleProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await authService.register({ name: name.trim() });
      setUser(user);
      setSession(user, {
        accessToken: localStorage.getItem('accessToken') || '',
        refreshToken: localStorage.getItem('refreshToken') || '',
      });
      router.replace(redirectTo.startsWith('/') ? redirectTo : '/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save profile'));
    } finally {
      setLoading(false);
    }
  };

  const phoneForm = (
    <form onSubmit={handleContinue} className="mt-5 w-full max-w-[340px] space-y-3.5">
      <label className="flex h-12 items-center overflow-hidden rounded-xl border border-[#e0e0e0] bg-white focus-within:border-[var(--cart-green)]">
        <span className="border-r border-[#e0e0e0] px-3.5 text-[15px] font-semibold text-[#1f1f1f]">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="Enter mobile number"
          value={phoneDigits}
          onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
          className="h-full flex-1 bg-transparent px-3 text-[15px] text-[#1f1f1f] outline-none placeholder:text-[#999]"
          autoFocus
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!phoneValid || loading}
        className={cn(
          'flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-bold text-white transition',
          phoneValid && !loading
            ? 'bg-[var(--cart-green)] hover:bg-[#097019]'
            : 'cursor-not-allowed bg-[#b0b0b0]',
        )}
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          'Continue'
        )}
      </button>

      <div className="relative py-1 text-center text-[11px] uppercase tracking-wide text-[#999]">
        <span className="relative z-10 bg-white px-2">or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-[#eee]" />
      </div>

      <button
        type="button"
        onClick={() => {
          setStep('email');
          setError('');
        }}
        className="flex h-11 w-full items-center justify-center rounded-xl border border-[#e0e0e0] text-[13px] font-semibold text-[#1f1f1f] hover:bg-[#fafafa]"
      >
        Continue with email
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e0e0e0] text-[12px] font-semibold text-[#1f1f1f] hover:bg-[#fafafa]"
        >
          Google
        </button>
        <button
          type="button"
          onClick={handleAppleLogin}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e0e0e0] text-[12px] font-semibold text-[#1f1f1f] hover:bg-[#fafafa]"
        >
          Apple
        </button>
      </div>

      <p className="pt-1 text-center text-[11px] leading-relaxed text-[#666]">
        By continuing, you agree to our{' '}
        <span className="underline decoration-dotted underline-offset-2">Terms of service</span>
        {' '}&{' '}
        <span className="underline decoration-dotted underline-offset-2">Privacy policy</span>
      </p>
    </form>
  );

  const emailForm = (
    <form onSubmit={handleEmailLogin} className="mt-5 w-full max-w-[340px] space-y-3.5">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setError('');
          }}
          className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-base font-extrabold text-[#1f1f1f]">Email login</h2>
      </div>

      <input
        type="email"
        autoComplete="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 w-full rounded-xl border border-[#e0e0e0] px-3 text-[15px] outline-none focus:border-[var(--cart-green)]"
        autoFocus
      />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-12 w-full rounded-xl border border-[#e0e0e0] px-3 text-[15px] outline-none focus:border-[var(--cart-green)]"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !email.trim() || !password}
        className={cn(
          'flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-bold text-white transition',
          !loading && email.trim() && password
            ? 'bg-[var(--cart-green)] hover:bg-[#097019]'
            : 'cursor-not-allowed bg-[#b0b0b0]',
        )}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-[11px] text-[#999]">
        Sample: rahul@example.com / Customer@123
      </p>
    </form>
  );

  const otpForm = (
    <div className="mt-2 w-full max-w-[340px]">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setError('');
          }}
          className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-base font-extrabold text-[#1f1f1f]">OTP Verification</h2>
      </div>

      <p className="mt-6 text-center text-sm text-[#666]">
        We have sent a verification code to{' '}
        <span className="font-semibold text-[#1f1f1f]">+91-{phoneDigits}</span>
      </p>

      <div className="mt-6 flex justify-center gap-2">
        {otpDigits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={d}
            onChange={(e) => onOtpChange(i, e.target.value)}
            onKeyDown={(e) => onOtpKeyDown(i, e)}
            onPaste={(e) => onOtpPaste(i, e)}
            onFocus={(e) => e.target.select()}
            className="h-12 w-10 rounded-lg border border-[#d0d0d0] text-center text-lg font-bold text-[#1f1f1f] outline-none focus:border-[var(--cart-green)] sm:h-14 sm:w-11"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
      {staticOtpHint && (
        <p className="mt-2 text-center text-xs text-[#999]">
          Use OTP <span className="font-semibold">{staticOtpHint}</span> (static / free mode)
        </p>
      )}

      <p className="mt-6 text-center text-sm text-[#999]">
        {resendIn > 0 ? (
          <>Resend Code (in {resendIn} secs)</>
        ) : (
          <button
            type="button"
            className="font-semibold text-[var(--cart-green)]"
            onClick={() => void sendOtp()}
            disabled={loading}
          >
            Resend Code
          </button>
        )}
      </p>
    </div>
  );

  const profileForm = (
    <form onSubmit={handleProfile} className="mt-2 w-full max-w-[340px] space-y-4">
      <h2 className="text-center text-xl font-extrabold text-[#1f1f1f]">Complete your profile</h2>
      <p className="text-center text-sm text-[#666]">Tell us your name to continue</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        required
        className="h-12 w-full rounded-xl border border-[#e0e0e0] px-3 text-base outline-none focus:border-[var(--cart-green)]"
        autoFocus
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--cart-green)] text-sm font-bold text-white disabled:bg-[#b0b0b0]"
      >
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      {/* —— Mobile: Blinkit full-screen with product mosaic —— */}
      <div className="flex h-dvh flex-col sm:hidden">
        <div className="relative min-h-[42%] flex-1 overflow-hidden bg-[#E8F4FC]">
          <div className="absolute inset-0 grid grid-cols-4 gap-2.5 p-3 pt-14 opacity-95">
            {LOGIN_PRODUCTS.map((src, i) => (
              <div
                key={src + i}
                className={cn(
                  'overflow-hidden rounded-2xl bg-white/70 shadow-sm',
                  i % 5 === 0 && 'translate-y-2',
                  i % 3 === 1 && '-translate-y-1',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/90 to-transparent" />

          <button
            type="button"
            onClick={handleChromeBack}
            className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1f1f1f" strokeWidth="2.25" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="relative z-10 -mt-6 flex flex-col items-center bg-white px-5 pb-8 pt-2">
          {step === 'phone' && (
            <>
              <LoginMark />
              <h1 className="mt-4 text-center text-[22px] font-extrabold leading-tight text-[#1f1f1f]">
                India&apos;s last minute app
              </h1>
              <p className="mt-1.5 text-center text-[14px] text-[#666]">Log in or Sign up</p>
              {phoneForm}
            </>
          )}
          {step === 'email' && emailForm}
          {step === 'otp' && otpForm}
          {step === 'profile' && profileForm}
        </div>
      </div>

      {/* —— Desktop / tablet: centered card —— */}
      <div className="relative hidden h-full items-center justify-center sm:flex">
        <button
          type="button"
          onClick={dismissLogin}
          className="absolute inset-0 bg-black/50 animate-fade-in"
          aria-label="Close login"
        />
        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-[400px] rounded-2xl bg-white p-7 shadow-xl animate-modal-in"
        >
          {step === 'phone' && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex w-full justify-start">
                <button
                  type="button"
                  onClick={handleChromeBack}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#1f1f1f] hover:bg-[#f5f5f5]"
                  aria-label="Back"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <LoginMark />
              <h1 className="mt-4 text-center text-[22px] font-extrabold text-[#1f1f1f]">
                India&apos;s last minute app
              </h1>
              <p className="mt-1 text-center text-sm text-[#666]">Log in or Sign up</p>
              {phoneForm}
            </div>
          )}
          {step === 'email' && (
            <div className="flex flex-col items-center">{emailForm}</div>
          )}
          {step === 'otp' && otpForm}
          {step === 'profile' && profileForm}
        </div>
      </div>
    </div>
  );
}
