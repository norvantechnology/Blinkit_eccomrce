'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  error?: boolean;
};

/** One real input (SMS autofill + paste) drawn as 6 boxes. */
export function OtpInput({ value, onChange, disabled, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = value.replace(/\D/g, '').slice(0, 6);

  return (
    <div
      className="relative mx-auto w-full max-w-[300px]"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        value={digits}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        aria-label="6-digit OTP"
        className="absolute inset-0 z-10 h-full w-full cursor-text bg-transparent text-[16px] text-transparent caret-transparent outline-none"
      />
      <div className="pointer-events-none flex gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const filled = Boolean(digits[i]);
          const active = digits.length === i;
          return (
            <div
              key={i}
              className={cn(
                'flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl border-2 bg-white text-[20px] font-bold text-[#1f1f1f]',
                error
                  ? 'border-red-400'
                  : filled || active
                    ? 'border-[#0C831F]'
                    : 'border-[#e4e4e4]',
              )}
            >
              {digits[i] ?? ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
