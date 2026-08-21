'use client';

import { cn } from '@/lib/utils';

/** CartButton — Blinkit 112×52, radius 8, CustomFont-style cart 28px, Okra-Bold 14. */
export function CartButton({ className }: { className?: string }) {
  return (
    <div className={cn('bk-cart-wrap', className)}>
      <button
        type="button"
        disabled
        title="Cart comes in Milestone 2"
        className="bk-cart"
        aria-label="My Cart (coming soon)"
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
        <span className="bk-cart__text">My Cart</span>
      </button>
    </div>
  );
}
