import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Tapi Grocery wordmark — yellow “Tapi” + green “Grocery”. */
export function BrandLogo({
  className,
  variant = 'header',
}: {
  className?: string;
  variant?: 'header' | 'modal';
}) {
  if (variant === 'modal') {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-yellow)] text-sm font-extrabold text-[#1f1f1f]">
          T
        </span>
        <span className="text-lg font-extrabold tracking-tight">
          <span className="text-[var(--brand-yellow)]">Tapi</span>{' '}
          <span className="text-[var(--cart-green)]">Grocery</span>
        </span>
      </div>
    );
  }

  return (
    <Link
      href="/"
      className={cn(
        'flex h-[86px] shrink-0 items-center pr-2',
        'hover:bg-[var(--header-hover)]',
        className,
      )}
      aria-label="Tapi Grocery home"
    >
      <span className="whitespace-nowrap text-[20px] font-extrabold leading-none tracking-tight lg:text-[22px]">
        <span className="text-[var(--brand-yellow)]">Tapi</span>{' '}
        <span className="text-[var(--cart-green)]">Grocery</span>
      </span>
    </Link>
  );
}
