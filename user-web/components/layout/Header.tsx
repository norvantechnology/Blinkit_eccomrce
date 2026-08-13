'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Search, UserRound } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { LocationBar } from '@/components/layout/LocationBar';
import { SearchBar } from '@/components/layout/SearchBar';
import { ProfileButton } from '@/components/layout/ProfileButton';
import { CartButton } from '@/components/layout/CartButton';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

/**
 * Blinkit desktop: header row is FULL viewport width (logo near left edge, cart near right).
 * Body banners stay in a narrower centered max-w container — header is intentionally wider.
 * Mobile: location + profile + search with normal page padding.
 */
export function Header() {
  const pathname = usePathname();
  const isAccount = pathname.startsWith('/account');
  const locationPickerOpen = useUiStore((s) => s.locationPickerOpen);

  return (
    <header
      className={cn(
        'sticky top-0 w-full border-b border-[#eee] bg-white',
        locationPickerOpen ? 'z-[120]' : 'z-40',
      )}
    >
      <div className="lg:hidden">
        {isAccount ? <MobileAccountHeader /> : <MobileHomeHeader />}
      </div>

      {/* Desktop — edge-to-edge like blinkit.com, comfortable side inset */}
      <div className="hidden h-[86px] w-full items-center px-8 lg:flex xl:px-10">
        <BrandLogo />
        <div className="mx-1 h-10 w-px shrink-0 bg-[#f0f0f0]" aria-hidden />
        <LocationBar className="w-[280px] shrink-0 px-2 xl:w-[320px]" />
        <SearchBar className="mx-3 min-w-0 flex-1 xl:mx-4" />
        <ProfileButton />
        <CartButton />
      </div>
    </header>
  );
}

function MobileHomeHeader() {
  const user = useAuthStore((s) => s.user);
  const accountHref = user ? '/account' : '/login?redirect=/account';

  return (
    <div className="px-4 pb-3 pt-3">
      <div className="flex items-start gap-3">
        <LocationBar compact className="min-w-0 flex-1 py-0" />
        <Link
          href={accountHref}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ddd] text-[#1f1f1f]"
          aria-label="Account"
        >
          <UserRound className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>
      <SearchBar className="mt-3 w-full" />
    </div>
  );
}

function MobileAccountHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const back = () => {
    if (pathname === '/account' || pathname === '/account/') {
      router.replace('/');
      return;
    }
    router.replace('/account');
  };

  return (
    <div className="px-3 pb-3 pt-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={back}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-[#1f1f1f]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <LocationBar compact className="min-w-0 flex-1 py-0" />
        <Link
          href="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center text-[#1f1f1f]"
          aria-label="Search"
          replace
        >
          <Search className="h-5 w-5" />
        </Link>
      </div>
      <SearchBar className="mt-2 w-full" />
    </div>
  );
}
