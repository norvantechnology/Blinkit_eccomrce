'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { authService } from '@/services/auth.service';
import { useI18n } from '@/lib/i18n/useI18n';
import type { MessageKey } from '@/lib/i18n/messages';

const NAV_ITEMS: { href: string; key: MessageKey; external?: boolean }[] = [
  { href: '/account/orders', key: 'account.orders' },
  { href: '/account/addresses', key: 'account.savedAddresses' },
  { href: '/account/prescriptions', key: 'account.prescriptions' },
  { href: '/account/gifts', key: 'account.gifts' },
  { href: '/faq', key: 'account.faq', external: true },
  { href: '/account/privacy', key: 'account.privacy' },
];

export function ProfileButton({ className }: { className?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const open = useUiStore((s) => s.accountDropdownOpen);
  const setAccountDropdownOpen = useUiStore((s) => s.setAccountDropdownOpen);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    return () => setAccountDropdownOpen(false);
  }, [setAccountDropdownOpen]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.header__overlay')) return;
      if (!ref.current?.contains(e.target as Node)) setAccountDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountDropdownOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setAccountDropdownOpen]);

  if (!hydrated) {
    return (
      <div className={cn('bk-profile', className)}>
        <div className="blinkit-shimmer h-4 w-16 rounded" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link href="/login?redirect=/" className={cn('bk-profile', className)}>
        <span className="bk-profile__label">{t('account.login')}</span>
      </Link>
    );
  }

  const phoneDisplay = user.phone?.replace(/^\+91/, '') || user.email || '';

  const handleLogout = async () => {
    setAccountDropdownOpen(false);
    await authService.logout();
    logout();
    router.replace('/');
    router.refresh();
  };

  return (
    <div ref={ref} className={cn('bk-profile-anchor', className)}>
      <button
        type="button"
        onClick={() => setAccountDropdownOpen(!open)}
        className={cn('bk-profile', open && 'is-open')}
        aria-expanded={open}
      >
        <span className="bk-profile__label">{t('account.account')}</span>
        <span className={cn('bk-profile__arrow', open && 'is-open')} aria-hidden />
      </button>

      {open ? (
        <div className="account-dropdown--container">
          <div className="account-dropdown__account-info">
            <div className="account-dropdown__account-info--heading">{t('account.myAccount')}</div>
            <div className="account-dropdown__account-info--phone">{phoneDisplay}</div>
          </div>
          <ul className="account-dropdown--list">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <div className="account-dropdown--nav_item full-width">
                  <Link
                    className="full-width"
                    href={item.href}
                    {...(item.external ? { rel: 'noopener noreferrer nofollow' } : {})}
                    onClick={() => setAccountDropdownOpen(false)}
                  >
                    {t(item.key)}
                  </Link>
                </div>
              </li>
            ))}
            <li>
              <div
                className="account-dropdown--nav_item account-dropdown__logout-btn full-width"
                role="button"
                tabIndex={0}
                onClick={handleLogout}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void handleLogout();
                  }
                }}
              >
                {t('account.logout')}
              </div>
            </li>
          </ul>
          <div className="account-dropdown__qrcode">
            <div className="AccountDropDown__QRCodeContainer-sc-1ngrhbv-0 dyvfcc">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/blinkit-parity/icons/app-download-qr.png"
                alt=""
                width={77}
                height={77}
                decoding="async"
              />
            </div>
            <div className="account-dropdown__qrcode--copy">
              <div className="account-dropdown__qrcode--heading">
                {t('footer.downloadApp')}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
