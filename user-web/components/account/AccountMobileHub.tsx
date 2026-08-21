'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

type HubItem = {
  href?: string;
  label: string;
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

function HubOption({ item }: { item: HubItem }) {
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
      <span className="ua-hub__label">{item.label}</span>
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

/** Mobile `/account` hub — icons match provided screenshot shapes. */
export function AccountMobileHub() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const phone = formatPhone(user?.phone ?? undefined) || user?.email || '';

  const handleLogout = async () => {
    await authService.logout();
    logout();
    router.replace('/');
    router.refresh();
  };

  const infoItems: HubItem[] = [
    { href: '/account/orders', label: 'Order History', icon: ICO.orders },
    { href: '/account/addresses', label: 'Address Book', icon: ICO.address },
    { href: '/account/wallet', label: 'Wallet Details', icon: ICO.wallet },
    { href: '/account/prescriptions', label: 'My Prescriptions', icon: ICO.prescriptions },
    { href: '/account/gifts', label: 'E-Gift Cards', icon: ICO.gift },
  ];

  const accountItems: HubItem[] = [
    { href: '/account/privacy', label: 'Account Privacy', icon: ICO.privacy },
    { label: 'Logout', icon: ICO.logout, onClick: () => void handleLogout() },
  ];

  return (
    <div className="ua-hub">
      <div className="ua-hub__phone">{phone}</div>
      <div className="ua-hub__section-label">Your Information</div>
      <div className="ua-hub__list">
        {[...infoItems, ...accountItems].map((item) => (
          <HubOption key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
