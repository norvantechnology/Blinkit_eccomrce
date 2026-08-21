'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { BlinkitIcon } from '@/components/layout/BlinkitIcon';
import { LocationBar } from '@/components/layout/LocationBar';
import { SearchBar } from '@/components/layout/SearchBar';
import { ProfileButton } from '@/components/layout/ProfileButton';
import { CartButton } from '@/components/layout/CartButton';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import '@/styles/blinkit-chrome.css';

/**
 * Blinkit header — CSS media queries own show/hide (do NOT mix Tailwind hidden/flex
 * with .bk-header__row { display:flex } or both layouts render).
 */
export function Header() {
  const pathname = usePathname();
  const isAccount = pathname.startsWith('/account');
  const locationPickerOpen = useUiStore((s) => s.locationPickerOpen);
  const accountDropdownOpen = useUiStore((s) => s.accountDropdownOpen);
  const setAccountDropdownOpen = useUiStore((s) => s.setAccountDropdownOpen);

  return (
    <header
      className={cn(
        'bk-header',
        locationPickerOpen && 'bk-header--location-open',
        !locationPickerOpen && accountDropdownOpen && 'bk-header--dropdown-open',
        !locationPickerOpen && !accountDropdownOpen && 'z-[1000]',
      )}
    >
      {accountDropdownOpen ? (
        <button
          type="button"
          className="header__overlay bk-dim-overlay"
          style={{ backgroundColor: 'rgba(50, 50, 50, 0.7)' }}
          aria-label="Close account menu"
          onClick={() => setAccountDropdownOpen(false)}
        />
      ) : null}

      {/* Mobile account chrome */}
      {isAccount && (
        <div className="bk-header__mobile-account">
          <MobileAccountChrome />
        </div>
      )}

      {/* Mobile home — only ≤1020px */}
      {!isAccount && (
        <div className="bk-header__row bk-header__row--mobile">
          <div className="bk-header__mobile-top">
            <LocationBar />
            <div className="bk-header__right">
              <MobileProfileIcon />
            </div>
          </div>
          <SearchBar />
        </div>
      )}

      {/* Desktop — only ≥1021px */}
      <div className="bk-header__row bk-header__row--desktop">
        <div className="bk-header__left">
          <BrandLogo />
          <div className="bk-divider-v" aria-hidden />
          <LocationBar />
        </div>
        <SearchBar />
        <div className="bk-header__right">
          <ProfileButton />
          <div className="bk-divider-v bk-divider-v--right" aria-hidden />
          <CartButton />
        </div>
      </div>
    </header>
  );
}

function MobileProfileIcon() {
  const user = useAuthStore((s) => s.user);
  const href = user ? '/account' : '/login?redirect=/account';
  return (
    <Link href={href} className="bk-profile bk-profile--icon" aria-label="Account">
      <BlinkitIcon name="profile" size={22} />
    </Link>
  );
}

function MobileAccountChrome() {
  const router = useRouter();
  const pathname = usePathname();

  const back = () => {
    if (pathname === '/account' || pathname === '/account/') {
      router.push('/');
      return;
    }
    // Prefer real browser history so nested account pages return correctly
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    if (pathname.startsWith('/account/profile')) {
      router.replace('/account/settings');
      return;
    }
    router.replace('/account');
  };

  return (
    <>
      <button
        type="button"
        onClick={back}
        className="flex h-[68px] w-11 shrink-0 items-center justify-center"
        aria-label="Back"
      >
        <BlinkitIcon name="back" size={14} />
      </button>
      <LocationBar className="bk-location--flush flex-1" />
      <Link
        href="/"
        replace
        className="flex h-[68px] w-11 shrink-0 items-center justify-center"
        aria-label="Home search"
      >
        <BlinkitIcon name="search" size={16} />
      </Link>
    </>
  );
}
