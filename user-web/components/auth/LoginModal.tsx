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

type Channel = 'phone' | 'email';
type Step = 'identifier' | 'otp' | 'profile';

interface LoginModalProps {
  onCloseHref?: string;
}

const goHome = () => {
  window.location.replace('/');
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function LoginModal({ onCloseHref = '/' }: LoginModalProps) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useI18n();

  const [channel, setChannel] = useState<Channel>('phone');
  const [step, setStep] = useState<Step>('identifier');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const verifyingRef = useRef(false);

  const formattedPhone = useMemo(() => formatPhoneForApi(phoneDigits), [phoneDigits]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits.replace(/\D/g, ''));
  const emailValid = isValidEmail(normalizedEmail);
  const identifierValid = channel === 'phone' ? phoneValid : emailValid;

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
    goHome();
  };

  const dismissLogin = () => {
    const next =
      onCloseHref.startsWith('/') && !onCloseHref.startsWith('//') ? onCloseHref : '/';
    router.replace(next);
  };

  const handleChromeBack = () => {
    if (step !== 'identifier') {
      setStep('identifier');
      setError('');
      setOtpCode('');
      return;
    }
    dismissLogin();
  };

  const otpChannel = () =>
    channel === 'phone' ? { phone: formattedPhone } : { email: normalizedEmail };

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.sendOtp(otpChannel());
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
    if (!identifierValid || loading) return;
    await sendOtp();
  };

  const verifyOtp = async (code: string) => {
    const normalized = code.replace(/\D/g, '').slice(0, 6);
    if (normalized.length !== 6 || loading || verifyingRef.current) return;
    verifyingRef.current = true;
    setError('');
    setLoading(true);
    try {
      const result = await authService.verifyOtp(otpChannel(), normalized);
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
      goHome();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save profile'));
    } finally {
      setLoading(false);
    }
  };

  const switchChannel = (next: Channel) => {
    if (next === channel) return;
    setChannel(next);
    setError('');
    setOtpCode('');
    setStep('identifier');
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
            {step === 'identifier' ? <LoginLottie /> : null}
            {step === 'identifier' && (
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

                <div className="login-channel" role="tablist" aria-label="Login method">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={channel === 'phone'}
                    className={cn('login-channel__btn', channel === 'phone' && 'is-active')}
                    onClick={() => switchChannel('phone')}
                  >
                    {t('login.withPhone')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={channel === 'email'}
                    className={cn('login-channel__btn', channel === 'email' && 'is-active')}
                    onClick={() => switchChannel('email')}
                  >
                    {t('login.withEmail')}
                  </button>
                </div>

                <form className="login-form" onSubmit={handleContinue}>
                  {channel === 'phone' ? (
                    <div className="login-phone">
                      <input
                        type="tel"
                        maxLength={10}
                        className="login-phone__input input"
                        data-test-id="phone-no-text-box"
                        placeholder={t('login.phonePlaceholder')}
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phoneDigits}
                        onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="login-email">
                      <input
                        type="email"
                        className="login-email__input input"
                        data-test-id="email-text-box"
                        placeholder={t('login.emailPlaceholder')}
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}

                  {error && <p className="login-form__error">{error}</p>}

                  <button
                    type="submit"
                    className={cn(
                      'PhoneNumberLogin__LoginButton',
                      identifierValid && !loading && 'is-enabled',
                    )}
                    disabled={!identifierValid || loading}
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
                <div className="login-help weight--semibold otp-text">{t('login.otpTitle')}</div>

                <div className="otp-msg">
                  <span className="otp-msg__label">{t('login.otpSent')}</span>
                  <div className="otp-msg__phone">
                    <span className="login-help weight--semibold login-help__phone">
                      {channel === 'phone' ? `+91-${phoneDigits}` : normalizedEmail}
                    </span>
                  </div>
                </div>

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
                  <div className="modal-error" role="alert">
                    Verification Failed.
                  </div>
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
