'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  error?: boolean;
};

/**
 * Blinkit OTP — one autofill input + 6 visual cells.
 * Cells: .otp__input (42px, pad 16×8, radius 8, gap 10). No group border.
 */
export function OtpInput({ value, onChange, disabled, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = value.replace(/\D/g, '').slice(0, 6);

  return (
    <div className="otp" onClick={() => inputRef.current?.focus()}>
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
        className="otp__native"
      />
      <div className="otp-input-container" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => {
          const filled = Boolean(digits[i]);
          const active = digits.length === i;
          return (
            <div
              key={i}
              className={cn(
                'otp__input',
                error && 'otp__input--error',
                !error && (filled || active) && 'otp__input--active',
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
