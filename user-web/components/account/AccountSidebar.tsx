'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useI18n } from '@/lib/i18n/useI18n';
import type { MessageKey } from '@/lib/i18n/messages';

/**
 * Blinkit profile-nav - uniform 20px icon column for alignment parity.
 * Glyphs: IconFont (location/orders/logout) + wasabicons (prescriptions/gift/privacy).
 */
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

  const isAddresses = pathname.startsWith('/account/addresses');
  const isOrders = pathname.startsWith('/account/orders');
  const isPrivacy =
    pathname.startsWith('/account/privacy') ||
    pathname.startsWith('/account/settings') ||
    pathname.startsWith('/account/profile');

  const items: Array<{
    href: string;
    key: MessageKey;
    ico: string;
    active: boolean;
  }> = [
    {
      href: '/account/addresses',
      key: 'account.addresses',
      ico: 'icon-location-on-map',
      active: isAddresses,
    },
    {
      href: '/account/orders',
      key: 'account.orders',
      ico: 'icon-orders',
      active: isOrders,
    },
    {
      href: '/account/prescriptions',
      key: 'account.prescriptions',
      ico: 'icon-food-menu-line',
      active: pathname.startsWith('/account/prescriptions'),
    },
    {
      href: '/account/gifts',
      key: 'account.gifts',
      ico: 'icon-new_gift_card',
      active: pathname.startsWith('/account/gifts'),
    },
    {
      href: '/account/privacy',
      key: 'account.privacy',
      ico: 'icon-lock-line',
      active: isPrivacy,
    },
  ];

  return (
    <div className="profile-nav">
      <div className="profile-nav__details-block">
        <div className="account-profile__phone">{phone}</div>
      </div>
      <nav className="profile-nav__list">
        <ul className="list-unstyled">
          {items.map(({ href, key, ico, active }) => (
            <Link
              key={href}
              className={cn('profile-nav__list-item', active && 'active')}
              href={href}
            >
              <li className="item-text">
                <span className={cn('profile-nav__ico', ico)} aria-hidden />
                <span className="profile-nav__label">{t(key)}</span>
              </li>
            </Link>
          ))}
          <li className="profile-nav__list-item">
            <div
              className="item-text login-logout-box"
              role="button"
              tabIndex={0}
              onClick={handleLogout}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void handleLogout();
                }
              }}
            >
              <span className="profile-nav__ico icon-logout" aria-hidden />
              <span className="profile-nav__label">{t('account.logout')}</span>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
