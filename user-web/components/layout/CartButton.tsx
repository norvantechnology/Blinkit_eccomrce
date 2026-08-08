'use client';

import { cn } from '@/lib/utils';

/** Empty cart — Blinkit style: grey fill, white icon + label. */
export function CartButton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-[86px] shrink-0 items-center pl-1', className)}>
      <button
        type="button"
        disabled
        title="Cart comes in Milestone 2"
        className={cn(
          'flex h-[48px] w-[112px] cursor-not-allowed items-center justify-center gap-2 rounded-lg',
          'bg-[#cccccc] text-white opacity-90',
        )}
        aria-label="My Cart (coming soon)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M7 4h-2l-1 2H1v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 7 20h12v-2H7.42a.25.25 0 0 1-.23-.15L8.1 16h7.45a2 2 0 0 0 1.79-1.11L21 6H6.21l-.94-2zM9 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        </svg>
        <span className="text-sm font-bold">My Cart</span>
      </button>
    </div>
  );
}
