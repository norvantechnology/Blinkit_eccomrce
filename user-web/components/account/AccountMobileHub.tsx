'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useI18n } from '@/lib/i18n/useI18n';
import type { MessageKey } from '@/lib/i18n/messages';

type HubItem = {
  href?: string;
  labelKey: MessageKey;
  icon: string;
  onClick?: () => void;
};

/** Screenshot-matched line icons (grey tiles). */
const ICO = {
  orders: '/blinkit-parity/icons/account/hub-order-history.svg',
  address: '/blinkit-parity/icons/account/hub-address-book.svg',
  wallet: '/blinkit-parity/icons/account/hub-wallet.svg',
  prescriptions: '/blinkit-parity/icons/account/hub-prescriptions.svg',
  gift: '/blinkit-parity/icons/account/hub-egift.svg',
  privacy: '/blinkit-parity/icons/account/hub-privacy.svg',
  logout: '/blinkit-parity/icons/account/hub-logout.svg',
} as const;

function formatPhone(raw?: string) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 10) return digits;
  return raw.replace(/^\+91\s?/, '');
}

function HubOption({ item, label }: { item: HubItem; label: string }) {
  const body = (
    <>
      <span className="ua-hub__icon-box" aria-hidden>
        <Image
          src={item.icon}
          alt=""
          width={22}
          height={22}
          className="ua-hub__icon"
          unoptimized
        />
      </span>
      <span className="ua-hub__label">{label}</span>
    </>
  );

  if (item.onClick) {
    return (
      <button type="button" className="ua-hub__row" onClick={item.onClick}>
        {body}
      </button>
    );
  }

  return (
    <Link href={item.href || '#'} className="ua-hub__row">
      {body}
    </Link>
  );
}

/** Mobile `/account` hub - icons match provided screenshot shapes. */
export function AccountMobileHub() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t, locale } = useI18n();
  const phone = formatPhone(user?.phone ?? undefined) || user?.email || '';

  const handleLogout = async () => {
    await authService.logout();
    logout();
    router.replace('/');
    router.refresh();
  };

  const infoItems: HubItem[] = [
    { href: '/account/orders', labelKey: 'account.orderHistory', icon: ICO.orders },
    { href: '/account/addresses', labelKey: 'account.addressBook', icon: ICO.address },
    { href: '/account/wallet', labelKey: 'account.wallet', icon: ICO.wallet },
    { href: '/account/prescriptions', labelKey: 'account.prescriptions', icon: ICO.prescriptions },
    { href: '/account/gifts', labelKey: 'account.gifts', icon: ICO.gift },
  ];

  const accountItems: HubItem[] = [
    { href: '/account/privacy', labelKey: 'account.privacy', icon: ICO.privacy },
    { labelKey: 'account.logout', icon: ICO.logout, onClick: () => void handleLogout() },
  ];

  return (
    <div className="ua-hub" key={locale} lang={locale}>
      <div className="ua-hub__phone">{phone}</div>
      <div className="ua-hub__section-label">{t('account.hub')}</div>
      <div className="ua-hub__list">
        {[...infoItems, ...accountItems].map((item) => (
          <HubOption key={`${locale}-${item.labelKey}`} item={item} label={t(item.labelKey)} />
        ))}
      </div>
    </div>
  );
}
