'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { setSession, getApiErrorMessage, type UserProfile, type AuthTokens } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { formatPhoneForApi, cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/useI18n';
import { OtpInput } from '@/components/auth/OtpInput';
import { LoginLottie } from '@/components/auth/LoginLottie';
import '@/styles/blinkit-login.css';

type Step = 'phone' | 'otp' | 'profile';

interface LoginModalProps {
  redirectTo?: string;
  onCloseHref?: string;
}

export function LoginModal({ redirectTo = '/', onCloseHref = '/' }: LoginModalProps) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useI18n();

  const [step, setStep] = useState<Step>('phone');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staticOtpHint, setStaticOtpHint] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const verifyingRef = useRef(false);

  const formattedPhone = useMemo(() => formatPhoneForApi(phoneDigits), [phoneDigits]);
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits.replace(/\D/g, ''));

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
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
      setOtpCode('');
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
      setOtpCode('');
      setResendIn(30);
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

  const verifyOtp = async (code: string) => {
    const normalized = code.replace(/\D/g, '').slice(0, 6);
    if (normalized.length !== 6 || loading || verifyingRef.current) return;
    verifyingRef.current = true;
    setError('');
    setLoading(true);
    try {
      const result = await authService.verifyOtp(formattedPhone, normalized);
      finishAuth(result.user, result.tokens);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid OTP'));
      setOtpCode('');
    } finally {
      verifyingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 'otp' || otpCode.length !== 6) return;
    void verifyOtp(otpCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode, step]);

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

  return (
    <div
      className="modal-overlay--login ReactModal__Overlay ReactModal__Overlay--after-open"
      onClick={dismissLogin}
      role="presentation"
    >
      <div
        className="ReactModal__Content ReactModal__Content--after-open modal-content--login"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={cn('LoginModal__BackIcon', step === 'otp' && 'OtpVerification__BackIcon')}
          onClick={handleChromeBack}
          aria-label="Back"
        >
          <svg viewBox="0 0 999 800" width="16" height="13" aria-hidden="true">
            <g transform="translate(0 729) scale(1 -1)">
              <path
                fill="currentColor"
                d="M949 379H169L434 644Q449 659 449 679Q449 699 434 714Q419 729 399 729Q379 729 364 714L14 364Q4 354 4 349Q0 338 0 329Q0 320 4 309Q7 307 9.5 302Q12 297 14 294L364-56Q379-71 399-71Q419-71 434-56Q449-41 449-21Q449-1 434 14L169 279H949Q972 279 985.5 293Q999 307 999 329.5Q999 352 985.5 365.5Q972 379 949 379Z"
              />
            </g>
          </svg>
        </button>

        <div className="LoginSteps__LoginWrapper login center-aligned">
          <div className="login__body">
            {/* Mobile only: Blinkit product Lottie above the sheet */}
            <LoginLottie />
            {step === 'phone' && (
              <div className="PhoneNumberLogin__LoginContainer">
                <div className="PhoneNumberLogin__ImageContainer">
                  <div className="ZImage__Container" style={{ height: 64, width: 64 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Tapi Grocery"
                      src="/tapi-app-logo.svg"
                      loading="lazy"
                      className="ZImage__img"
                      width={64}
                      height={64}
                    />
                  </div>
                </div>

                <div className="login-help weight--semibold">
                  <div>
                    <div className="login-head__text">{t('login.title')}</div>
                    <div className="login-help weight--semibold">{t('login.subtitle')}</div>
                  </div>
                </div>

                <form className="login-form" onSubmit={handleContinue}>
                  <div className="login-phone">
                    <input
                      type="tel"
                      maxLength={10}
                      className="login-phone__input input"
                      data-test-id="phone-no-text-box"
                      placeholder="Enter mobile number"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phoneDigits}
                      onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      autoFocus
                    />
                  </div>

                  {error && <p className="login-form__error">{error}</p>}

                  <button
                    type="submit"
                    className={cn(
                      'PhoneNumberLogin__LoginButton',
                      phoneValid && !loading && 'is-enabled',
                    )}
                    disabled={!phoneValid || loading}
                  >
                    {loading ? '…' : t('login.continue')}
                  </button>
                </form>

                <div className="PhoneNumberLogin__LinksWrapper">
                  <span>By continuing, you agree to our&nbsp;</span>
                  <a target="_blank" href="/terms" className="PhoneNumberLogin__Links">
                    Terms of service
                  </a>
                  <span>&nbsp;&amp;&nbsp;</span>
                  <a target="_blank" href="/privacy" className="PhoneNumberLogin__Links">
                    Privacy policy
                  </a>
                </div>
              </div>
            )}

            {step === 'otp' && (
              <div className="login-step-secondary login-otp-step">
                {/* Blinkit: login-help + otp-text (not login-head__text on desktop) */}
                <div className="login-help weight--semibold otp-text">
                  {t('login.otpTitle')}
                </div>

                <div className="otp-msg">
                  <span className="otp-msg__label">{t('login.otpSent')}</span>
                  {/* Desktop: phone on its own line (block), matching Blinkit */}
                  <div className="otp-msg__phone otp-only-desktop">
                    <span className="login-help weight--semibold login-help__phone">
                      +91-{phoneDigits}
                    </span>
                  </div>
                  {/* Mobile: inline phone (unchanged) */}
                  <span className="login-help weight--semibold login-help__phone otp-only-mobile">
                    {' '}
                    +91 {phoneDigits}
                  </span>
                </div>

                <button
                  type="button"
                  className="login-change-number otp-only-mobile"
                  onClick={() => {
                    setStep('phone');
                    setError('');
                    setOtpCode('');
                  }}
                >
                  {t('login.changeNumber')}
                </button>

                <div className="otp-block">
                  <OtpInput
                    value={otpCode}
                    onChange={(digits) => {
                      setError('');
                      setOtpCode(digits);
                    }}
                    disabled={loading}
                    error={Boolean(error)}
                  />

                  {staticOtpHint && (
                    <p className="otp-hint otp-only-mobile">
                      {t('login.staticOtp', { code: staticOtpHint })}
                    </p>
                  )}

                  <button
                    type="button"
                    className={cn(
                      'PhoneNumberLogin__LoginButton',
                      'otp-only-mobile',
                      otpCode.length === 6 && !loading && 'is-enabled',
                    )}
                    disabled={otpCode.length !== 6 || loading}
                    onClick={() => void verifyOtp(otpCode)}
                  >
                    {loading ? t('login.verifying') : t('login.verify')}
                  </button>

                  {resendIn > 0 ? (
                    <p className="otp-resend otp-resend--disabled">
                      {t('login.resendIn', { n: resendIn })}
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="otp-resend otp-resend--enabled is-ready"
                      data-test-id="resend-otp"
                      onClick={() => void sendOtp()}
                      disabled={loading}
                    >
                      {t('login.resend')}
                    </button>
                  )}
                </div>

                {error ? (
                  <>
                    <p className="login-form__error otp-only-mobile">{error}</p>
                    <div className="modal-error otp-only-desktop" role="alert">
                      Verification Failed.
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {step === 'profile' && (
              <form className="login-step-secondary" onSubmit={handleProfile}>
                <h2 className="login-head__text">{t('login.profileTitle')}</h2>
                <p className="login-help weight--semibold">Tell us your name to continue</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="login-name__input input"
                  autoFocus
                />
                {error && <p className="login-form__error">{error}</p>}
                <button
                  type="submit"
                  className={cn(
                    'PhoneNumberLogin__LoginButton',
                    name.trim() && !loading && 'is-enabled',
                  )}
                  disabled={loading || !name.trim()}
                >
                  {loading ? 'Saving…' : 'Continue'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
