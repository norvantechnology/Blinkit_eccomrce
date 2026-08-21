import Link from 'next/link';
import { cn } from '@/lib/utils';

/** BlinkitLogo__LogoContainer — 178×86; wordmark like blinkit (yellow + green). */
export function BrandLogo({
  className,
  variant = 'header',
}: {
  className?: string;
  variant?: 'header' | 'modal';
}) {
  if (variant === 'modal') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8CB46] text-[15px] font-extrabold lowercase tracking-[-0.03em] text-[#0C831F]">
          tapi
        </span>
      </div>
    );
  }

  return (
    <Link href="/" replace className={cn('bk-logo', className)} aria-label="Tapi Grocery home">
      <span className="bk-logo__text">
        <span className="bk-logo__tapi">tapi</span>
        <span className="bk-logo__grocery">grocery</span>
      </span>
    </Link>
  );
}
