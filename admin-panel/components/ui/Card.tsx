import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  variant?: 'default' | 'muted' | 'plain' | 'ghost';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

/** Soft rounded surface for admin cards. */
export function Card({
  children,
  className,
  hover,
  padding = 'md',
  variant = 'default',
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)]',
        variant === 'default' &&
          'border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]',
        variant === 'muted' && 'border border-[var(--border)] bg-[var(--surface-muted)]',
        variant === 'plain' && 'border border-[var(--border)] bg-[var(--surface)]',
        variant === 'ghost' && 'bg-transparent',
        hover && 'transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]',
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
