'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

export function ProfileButton({ className }: { className?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!hydrated) {
    return (
      <div className={cn('flex h-[86px] w-[100px] items-center justify-center', className)}>
        <div className="blinkit-shimmer h-4 w-16 rounded" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          'flex h-[86px] items-center justify-center px-3 text-[16px] text-[#1f1f1f] hover:bg-[var(--header-hover)]',
          className,
        )}
      >
        Login
      </Link>
    );
  }

  const phoneDisplay = user.phone?.replace(/^\+91/, '') || user.email || '';

  const handleLogout = async () => {
    setOpen(false);
    await authService.logout();
    logout();
    router.replace('/');
    router.refresh();
  };

  return (
    <div ref={ref} className={cn('relative flex h-[86px] items-center', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-full items-center gap-1 px-3 text-[16px] text-[#1f1f1f] hover:bg-[var(--header-hover)]"
      >
        Account
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%-8px)] z-50 w-[280px] overflow-hidden rounded-xl border border-[#eee] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-fade-in">
          <div className="border-b border-[#f0f0f0] px-4 py-3">
            <p className="text-[15px] font-extrabold text-[#1f1f1f]">My Account</p>
            <p className="mt-0.5 text-[13px] text-[#666]">{phoneDisplay}</p>
          </div>
          <nav className="py-1">
            {[
              { href: '/account', label: 'My Orders', soon: true },
              { href: '/account/addresses', label: 'Saved Addresses' },
              { href: '/account', label: 'My Prescriptions', soon: true },
              { href: '/account', label: 'E-Gift Cards', soon: true },
              { href: '/account', label: "FAQ's", soon: true },
              { href: '/account/settings', label: 'Account privacy' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-[14px] text-[#1f1f1f] hover:bg-[#f7f7f7]"
              >
                {item.label}
                {item.soon && (
                  <span className="ml-2 text-[10px] font-semibold uppercase text-[#999]">Soon</span>
                )}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-4 py-2.5 text-left text-[14px] text-[#1f1f1f] hover:bg-[#f7f7f7]"
            >
              Log Out
            </button>
          </nav>
          <div className="flex items-center gap-3 border-t border-[#f0f0f0] bg-[#fafafa] px-4 py-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-[#e5e5e5] bg-white text-[9px] font-bold text-[#999]">
              QR
            </div>
            <p className="text-[11px] leading-snug text-[#555]">
              Simple way to get groceries{' '}
              <span className="font-semibold text-[#2563eb]">at your doorstep</span>. Scan & download
              the Tapi Grocery app.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
