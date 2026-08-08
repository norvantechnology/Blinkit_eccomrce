'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AccountSidebar } from '@/components/account/AccountSidebar';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login?redirect=/account');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="bg-white px-4 py-16 text-center text-sm text-[#999]">Loading…</div>
    );
  }

  return (
    <>
      {/* Mobile: full-bleed white, no sidebar card */}
      <div className="min-h-[60vh] bg-white px-4 pb-8 pt-2 lg:hidden">{children}</div>

      {/* Desktop: Blinkit account shell */}
      <div className="hidden min-h-[70vh] bg-[#f4f6fb] lg:block">
        <div className="mx-auto max-w-[1100px] px-4 py-8">
          <div className="flex overflow-hidden rounded-xl border border-[#e8e8e8] bg-white">
            <div className="w-[260px] shrink-0 border-r border-[#eee]">
              <AccountSidebar />
            </div>
            <div className="min-w-0 flex-1 p-8">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
