'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/useI18n';
import type { MessageKey } from '@/lib/i18n/messages';
import { OtpInput } from '@/components/auth/OtpInput';
import '@/styles/blinkit-delete-account.css';

const REASONS: { id: string; key: MessageKey }[] = [
  { id: 'not-using', key: 'settings.reasonNotUsing' },
  { id: 'different-account', key: 'settings.reasonDifferentAccount' },
  { id: 'privacy', key: 'settings.reasonPrivacy' },
  { id: 'notifications', key: 'settings.reasonNotifications' },
  { id: 'not-working', key: 'settings.reasonNotWorking' },
  { id: 'other', key: 'settings.reasonOther' },
];

function formatPhoneDisplay(phone: string | null) {
  const digits = (phone || '').replace(/\D/g, '');
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  return ten ? `+91-${ten}` : '';
}

function formatContactDisplay(user: { phone: string | null; email: string | null }) {
  if (user.phone) return formatPhoneDisplay(user.phone);
  return user.email || '';
}

function DeleteAccountFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useI18n();

  const reasonId = searchParams.get('reason') || '';
  const reason = useMemo(() => REASONS.find((r) => r.id === reasonId) || null, [reasonId]);

  const [feedback, setFeedback] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const sendDeleteOtp = async () => {
    setError('');
    setDeleting(true);
    try {
      await authService.sendDeleteOtp();
      setOtpCode('');
      setResendIn(30);
      setConfirmOpen(false);
      setOtpOpen(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send OTP'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (code: string) => {
    const normalized = code.replace(/\D/g, '').slice(0, 6);
    if (normalized.length !== 6 || deleting || verifyingRef.current) return;
    verifyingRef.current = true;
    setDeleting(true);
    setError('');
    try {
      await authService.deleteAccount(normalized);
      logout();
      router.replace('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid OTP'));
      setOtpCode('');
      setDeleting(false);
      verifyingRef.current = false;
    }
  };

  useEffect(() => {
    if (!otpOpen || otpCode.length !== 6) return;
    void handleDelete(otpCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode, otpOpen]);

  if (!user) return null;

  if (reason) {
    return (
      <div className="bk-del">
        <div className="bk-del__feedback">
          {otpOpen ? (
            <>
              <h1 className="bk-del__title">{t('settings.deleteOtpTitle')}</h1>
              <p className="bk-del__sub">
                {t('settings.deleteOtpSent')}
                <span className="bk-del__otp-phone">{formatContactDisplay(user)}</span>
              </p>
              <div className="bk-del__otp">
                <OtpInput value={otpCode} onChange={setOtpCode} disabled={deleting} error={Boolean(error)} />
              </div>
              {resendIn > 0 ? (
                <p className="bk-del__otp-resend is-wait">{t('login.resendIn', { n: resendIn })}</p>
              ) : (
                <button
                  type="button"
                  className="bk-del__otp-resend is-ready"
                  disabled={deleting}
                  onClick={() => void sendDeleteOtp()}
                >
                  {t('login.resend')}
                </button>
              )}
            </>
          ) : (
            <>
              <h1 className="bk-del__title">{t(reason.key)}</h1>
              <p className="bk-del__sub">{t('settings.deleteFeedbackPrompt')}</p>
              <textarea
                className="bk-del__textarea"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('settings.deleteFeedbackPlaceholder')}
                rows={3}
              />
              <button
                type="button"
                className="bk-del__cta"
                disabled={deleting}
                onClick={() => setConfirmOpen(true)}
              >
                {t('settings.deleteMyAccount')}
              </button>
              <p className="bk-del__note">{t('settings.deleteNote')}</p>
            </>
          )}
          {error ? <p className="bk-del__error">{error}</p> : null}
        </div>

        {confirmOpen ? (
          <div className="bk-del-sheet-root" role="dialog" aria-modal="true">
            <button
              type="button"
              className="bk-del-sheet-dim"
              aria-label="Close"
              disabled={deleting}
              onClick={() => !deleting && setConfirmOpen(false)}
            />
            <button
              type="button"
              className="bk-del-sheet-close"
              aria-label="Close"
              disabled={deleting}
              onClick={() => !deleting && setConfirmOpen(false)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="bk-del-sheet">
              <div className="bk-del-sheet__art">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/blinkit-parity/icons/account/delete-account-popup.png"
                  alt=""
                  width={88}
                  height={88}
                />
              </div>
              <h2 className="bk-del-sheet__title">{t('settings.deletingAccountTitle')}</h2>
              <p className="bk-del-sheet__body">{t('settings.deleteConfirmBody')}</p>
              {error ? <p className="bk-del__error bk-del__error--sheet">{error}</p> : null}
              <div className="bk-del-sheet__actions">
                <button type="button" disabled={deleting} onClick={() => setConfirmOpen(false)}>
                  {t('settings.cancel')}
                </button>
                <button type="button" disabled={deleting} onClick={() => void sendDeleteOtp()}>
                  {deleting ? t('settings.deleting') : t('settings.delete')}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bk-del">
      <div className="bk-del__intro">
        <h1 className="bk-del__title">{t('settings.deletePageTitle')}</h1>
        <p className="bk-del__sub">{t('settings.deleteWhy')}</p>
      </div>
      <ul className="bk-del__list">
        {REASONS.map((item) => (
          <li key={item.id}>
            <Link href={`/account/privacy/delete?reason=${item.id}`} className="bk-del__row">
              <span>{t(item.key)}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/blinkit-parity/icons/account/chevron-right.svg" alt="" width={12} height={12} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <Suspense fallback={null}>
      <DeleteAccountFlow />
    </Suspense>
  );
}
