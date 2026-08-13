'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  MapPin,
  ClipboardList,
  FileText,
  Gift,
  Lock,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useI18n } from '@/lib/i18n/useI18n';

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useI18n();

  const phone = user?.phone
    ? user.phone.startsWith('+')
      ? user.phone
      : `+91${user.phone.replace(/^\+?91/, '')}`
    : user?.email || '';

  const handleLogout = async () => {
    await authService.logout();
    logout();
    router.replace('/');
    router.refresh();
  };

  const nav = [
    { href: '/account/addresses', label: t('account.addresses'), icon: MapPin },
    { href: '/account', label: 'My Orders', icon: ClipboardList, soon: true },
    { href: '/account', label: 'My Prescriptions', icon: FileText, soon: true },
    { href: '/account', label: 'E-Gift Cards', icon: Gift, soon: true },
    { href: '/account/settings', label: t('account.settings'), icon: Lock },
  ];

  return (
    <aside className="w-full">
      <div className="border-b border-[#f0f0f0] px-4 py-3.5">
        <p className="text-[13px] text-[#666]">{phone}</p>
      </div>
      <nav className="p-2">
        {nav.map(({ href, label, icon: Icon, soon }) => {
          const isActive =
            (href === '/account/addresses' && pathname.startsWith('/account/addresses')) ||
            (href === '/account/settings' &&
              (pathname.startsWith('/account/settings') || pathname.startsWith('/account/profile')));

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] transition',
                isActive
                  ? 'bg-[#f2f2f2] font-bold text-[#1f1f1f]'
                  : 'font-medium text-[#1f1f1f] hover:bg-[#f7f7f7]',
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0 text-[#555]" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {soon && (
                <span className="text-[10px] font-semibold uppercase text-[#999]">Soon</span>
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] font-medium text-[#1f1f1f] hover:bg-[#f7f7f7]"
        >
          <LogOut className="h-[18px] w-[18px] text-[#555]" strokeWidth={1.75} />
          {t('account.logout')}
        </button>
      </nav>
    </aside>
  );
}
