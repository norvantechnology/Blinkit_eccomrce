'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MapPin,
  Wallet,
  FileText,
  Gift,
  Shield,
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
  { href: '/account/settings', labelKey: 'account.privacy' as const, icon: Shield },
];

/** Mobile hub: Blinkit “Your Information”. Desktop shows the same list in the content pane. */
export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useI18n();

  if (!user) return null;

  const phone = (user.phone || '').replace(/^\+91/, '') || user.email || '';

  const handleLogout = async () => {
    await authService.logout();
    logout();
    router.replace('/');
  };

  return (
    <div>
      <h1 className="mb-4 hidden text-[22px] font-extrabold text-[#1f1f1f] lg:block">{t('account.title')}</h1>
      <p className="text-[15px] text-[#888] lg:hidden">{phone}</p>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-[#999] lg:mt-0">
        {t('account.hub')}
      </p>

      <ul className="mt-2">
        {ITEMS.map(({ href, label, labelKey, icon: Icon, soon }) => (
          <li key={labelKey || label}>
            <Link
              href={href}
              className="flex items-center gap-3 border-b border-[#f5f5f5] py-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5] text-[#555]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-[15px] font-medium text-[#1f1f1f]">
                {labelKey ? t(labelKey) : label}
              </span>
              {soon ? (
                <span className="text-[10px] font-semibold uppercase text-[#bbb]">Soon</span>
              ) : null}
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 py-3.5 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5] text-[#555]">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="text-[15px] font-medium text-[#1f1f1f]">{t('account.logout')}</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
