'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, hint, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const errorId = id ? `${id}-error` : undefined;
    const hintId = id ? `${id}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-semibold text-slate-800"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2',
                error ? 'text-red-500' : 'text-slate-500',
              )}
              aria-hidden
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            type={inputType}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              'block w-full rounded-lg border bg-[var(--surface-muted)] text-sm text-slate-900',
              'transition-colors duration-150 placeholder:text-slate-400',
              'focus:bg-white focus:outline-none focus:ring-4',
              error
                ? 'border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-red-500/15'
                : 'border-[var(--border)] hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-[var(--ring)]',
              leftIcon ? 'pl-10 pr-4' : 'px-4',
              isPassword ? 'pr-11' : '',
              'py-3',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={0}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {/* Fixed-height message slot keeps layout stable when errors appear */}
        <div className="mt-1.5 min-h-[1.125rem]" aria-live="polite">
          {error ? (
            <p id={errorId} className="text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : hint ? (
            <p id={hintId} className="text-xs text-slate-500">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
    );
  },
);

Input.displayName = 'Input';
