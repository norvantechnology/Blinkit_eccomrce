'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { BlinkitPageLoader } from '@/components/layout/BlinkitPageLoader';
import { cn } from '@/lib/utils';
import '@/styles/blinkit-iconfont.css';
import '@/styles/blinkit-account.css';
import '@/styles/blinkit-addresses.css';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isHub = pathname === '/account' || pathname === '/account/';

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/account')}`);
    }
  }, [hydrated, user, router, pathname]);

  if (!hydrated || !user) {
    return <BlinkitPageLoader className="bk-feed-loader--in-main" />;
  }

  /* Mobile hub is full-bleed Blinkit profile page (no desktop card chrome) */
  if (isHub) {
    return <div className="bk-account-hub-root">{children}</div>;
  }

  return (
    <div className="wrapper my-profile_rn">
      <div className="my-profile__wrapper_rn card_rn">
        <div className="my-profile__left hide@mobile">
          <AccountSidebar />
        </div>
        <div className={cn('my-profile__right_rn')}>{children}</div>
      </div>
    </div>
  );
}
