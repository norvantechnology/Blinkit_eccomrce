'use client';

import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/useI18n';

/** CartButton - Blinkit 112×52, radius 8, CustomFont-style cart 28px, Okra-Bold 14. */
export function CartButton({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn('bk-cart-wrap', className)}>
      <button
        type="button"
        disabled
        title={t('header.cartSoon')}
        className="bk-cart"
        aria-label={t('header.cart')}
      >
        <span className="bk-cart__icon" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blinkit-parity/icons/cart-white.svg"
            alt=""
            width={28}
            height={28}
          />
        </span>
        <span className="bk-cart__text">{t('header.cart')}</span>
      </button>
    </div>
  );
}
