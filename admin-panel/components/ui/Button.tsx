'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)] hover:shadow active:bg-[#075a14] active:scale-[0.98] focus-visible:ring-[var(--primary)]',
  secondary:
    'bg-[var(--surface-muted)] text-[#1f1f1f] hover:bg-[#eeeeee] active:bg-[#e0e0e0] active:scale-[0.98] focus-visible:ring-[var(--border-strong)]',
  ghost:
    'text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[#1f1f1f] active:bg-[#eeeeee] active:scale-[0.98]',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 active:scale-[0.98] focus-visible:ring-red-500',
  outline:
    'border border-[var(--border)] bg-white text-[#1f1f1f] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] active:bg-[#eeeeee] active:scale-[0.98] focus-visible:ring-[var(--border-strong)]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm font-semibold',
  lg: 'h-12 gap-2.5 rounded-xl px-6 text-sm font-semibold',
  icon: 'h-10 w-10 rounded-xl p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  ),
);

Button.displayName = 'Button';
