import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BRAND_ASSETS } from '@/lib/brand-assets';

/** BlinkitLogo__LogoContainer - wordmark from S3 brand kit. */
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_ASSETS.appIcon}
          alt="Tapi Grocery"
          width={64}
          height={64}
          className="h-16 w-16 rounded-2xl object-cover"
        />
      </div>
    );
  }

  return (
    <Link href="/" replace className={cn('bk-logo', className)} aria-label="Tapi Grocery home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ASSETS.wordmark}
        alt="Tapi Grocery"
        width={149}
        height={91}
        className="bk-logo__img"
      />
    </Link>
  );
}
