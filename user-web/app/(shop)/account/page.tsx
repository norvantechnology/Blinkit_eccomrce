'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MapPin,
  Wallet,
  FileText,
  Gift,
  Lock,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useI18n } from '@/lib/i18n/useI18n';

const ITEMS = [
  { href: '/account', label: 'Order History', icon: Clock, soon: true },
  { href: '/account/addresses', labelKey: 'account.addressBook' as const, icon: MapPin },
  { href: '/account', label: 'Wallet Details', icon: Wallet, soon: true },
  { href: '/account', label: 'My Prescriptions', icon: FileText, soon: true },
  { href: '/account', label: 'E-Gift Cards', icon: Gift, soon: true },
  { href: '/account/settings', labelKey: 'account.privacy' as const, icon: Lock },
];

/** Mobile hub: Blinkit “Your Information”. Desktop shows the same list in the content pane. */
export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useI18n();

  if (!user) return null;

  const phone = user.phone
    ? user.phone.replace(/^\+?91/, '')
    : user.email || '';

  const handleLogout = async () => {
    await authService.logout();
    logout();
    router.replace('/');
  };

  return (
    <div>
      <h1 className="mb-4 hidden text-[22px] font-extrabold text-[#1f1f1f] lg:block">
        {t('account.title')}
      </h1>
      <p className="text-[15px] text-[#8a8a8a] lg:hidden">{phone}</p>

      <p className="mt-6 text-[13px] font-medium text-[#9a9a9a] lg:mt-0">{t('account.hub')}</p>

      <ul className="mt-1">
        {ITEMS.map(({ href, label, labelKey, icon: Icon, soon }) => (
          <li key={labelKey || label}>
            <Link href={href} className="flex items-center gap-3.5 py-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f3f3] text-[#4a4a4a]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-[15px] font-medium text-[#1f1f1f]">
                {labelKey ? t(labelKey) : label}
              </span>
              {soon ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#bbb]">
                  Soon
                </span>
              ) : null}
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 py-3.5 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f3f3] text-[#4a4a4a]">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="text-[15px] font-medium text-[#1f1f1f]">{t('account.logout')}</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
