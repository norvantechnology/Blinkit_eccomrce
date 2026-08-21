'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AccountMobileHub } from '@/components/account/AccountMobileHub';

/**
 * Blinkit `/account`:
 * - Mobile (&lt;1020): Your Information hub
 * - Desktop (≥1020): redirect to addresses (sidebar shell)
 */
export default function AccountIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1020px)');
    const goDesktop = () => {
      if (mq.matches) router.replace('/account/addresses');
    };
    goDesktop();
    mq.addEventListener('change', goDesktop);
    return () => mq.removeEventListener('change', goDesktop);
  }, [router]);

  return (
    <>
      {/* SSR / first paint: show hub; desktop effect redirects */}
      <div className="bk-account-only-mobile">
        <AccountMobileHub />
      </div>
      <div className="bk-account-only-desktop bg-white px-4 py-16 text-center text-sm text-[#999]">
        Loading…
      </div>
    </>
  );
}
