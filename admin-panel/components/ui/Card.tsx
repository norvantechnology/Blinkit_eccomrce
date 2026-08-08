import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted';
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

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
        'rounded-xl border shadow-sm',
        variant === 'default'
          ? 'border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_2px_var(--shadow-color),0_4px_12px_rgba(15,23,42,0.06)]'
          : 'border-[var(--border)] bg-[var(--surface-muted)]',
        hover &&
          'transition-all duration-150 hover:border-[var(--border-strong)] hover:shadow-[0_2px_4px_var(--shadow-color),0_8px_16px_rgba(15,23,42,0.08)]',
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
