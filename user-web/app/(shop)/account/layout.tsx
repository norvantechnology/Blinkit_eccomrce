'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AccountSidebar } from '@/components/account/AccountSidebar';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/account')}`);
    }
  }, [hydrated, user, router, pathname]);

  if (!hydrated || !user) {
    return (
      <div className="bg-white px-4 py-16 text-center text-sm text-[#999]">Loading…</div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-white lg:min-h-[70vh] lg:bg-[#f4f6fb]">
      <div className="lg:mx-auto lg:max-w-[1100px] lg:px-4 lg:py-8">
        <div className="lg:flex lg:overflow-hidden lg:rounded-xl lg:border lg:border-[#e8e8e8] lg:bg-white">
          <div className="hidden w-[260px] shrink-0 border-r border-[#eee] lg:block">
            <AccountSidebar />
          </div>
          <div className="min-w-0 flex-1 px-4 pb-10 pt-3 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
