import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  inverted?: boolean;
}

const sizeMap = {
  sm: { mark: 'h-8 w-8 text-sm', title: 'text-sm', subtitle: 'text-[9px]' },
  md: { mark: 'h-9 w-9 text-sm', title: 'text-sm', subtitle: 'text-[10px]' },
  lg: { mark: 'h-11 w-11 text-base', title: 'text-base', subtitle: 'text-[10px]' },
};

/** Tapi Grocery wordmark - yellow “Tapi” + green “Grocery” (matches user-web). */
export function BrandLogo({
  size = 'md',
  showSubtitle = true,
  className,
  inverted = false,
}: BrandLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-2xl font-extrabold text-[#1f1f1f]',
          s.mark,
          'bg-[var(--brand-yellow)]',
        )}
      >
        T
      </div>
      <div className="min-w-0">
        <p className={cn('truncate font-extrabold tracking-tight leading-tight', s.title)}>
          <span className="text-[var(--brand-yellow)]">Tapi</span>{' '}
          <span className={inverted ? 'text-white' : 'text-[var(--primary)]'}>Grocery</span>
        </p>
        {showSubtitle && (
          <p
            className={cn(
              'truncate font-semibold uppercase tracking-wider',
              s.subtitle,
              inverted ? 'text-white/70' : 'text-[var(--muted)]',
            )}
          >
            Admin Panel
          </p>
        )}
      </div>
    </div>
  );
}
