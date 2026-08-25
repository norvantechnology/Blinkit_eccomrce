import { cn } from '@/lib/utils';
import { BRAND_ASSETS } from '@/lib/brand-assets';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  inverted?: boolean;
}

const sizeMap = {
  sm: { mark: 'h-8 w-auto max-h-8', title: 'text-sm', subtitle: 'text-[9px]', imgH: 32 },
  md: { mark: 'h-9 w-auto max-h-9', title: 'text-sm', subtitle: 'text-[10px]', imgH: 36 },
  lg: { mark: 'h-11 w-auto max-h-11', title: 'text-base', subtitle: 'text-[10px]', imgH: 44 },
};

/** Tapi Grocery wordmark from S3 brand kit. */
export function BrandLogo({
  size = 'md',
  showSubtitle = true,
  className,
  inverted = false,
}: BrandLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ASSETS.wordmark}
        alt="Tapi Grocery"
        height={s.imgH}
        className={cn('shrink-0 object-contain', s.mark)}
      />
      {showSubtitle && (
        <div className="min-w-0">
          <p
            className={cn(
              'truncate font-semibold uppercase tracking-wider',
              s.subtitle,
              inverted ? 'text-white/70' : 'text-[var(--muted)]',
            )}
          >
            Admin Panel
          </p>
        </div>
      )}
    </div>
  );
}
