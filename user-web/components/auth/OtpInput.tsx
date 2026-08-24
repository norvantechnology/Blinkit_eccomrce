'use client';

import { useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  error?: boolean;
  length?: number;
};

/**
 * Blinkit OTP - one real <input class="otp__input input"> per digit.
 * Focus: outline 0, caret transparent, border stays #ccc (same as Blinkit).
 */
export function OtpInput({ value, onChange, disabled, error, length = 6 }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.replace(/\D/g, '').slice(0, length).split('');

  const setDigit = (index: number, char: string) => {
    const next = Array.from({ length }, (_, i) => digits[i] ?? '');
    next[index] = char;
    onChange(next.join('').replace(/\D/g, '').slice(0, length));
  };

  const focusAt = (index: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      setDigit(index, '');
      return;
    }
    // Paste / multi-char into one box
    if (cleaned.length > 1) {
      const next = Array.from({ length }, (_, i) => digits[i] ?? '');
      for (let i = 0; i < cleaned.length && index + i < length; i += 1) {
        next[index + i] = cleaned[i]!;
      }
      onChange(next.join(''));
      focusAt(Math.min(index + cleaned.length, length - 1));
      return;
    }
    setDigit(index, cleaned);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        setDigit(index, '');
      } else if (index > 0) {
        setDigit(index - 1, '');
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="otp">
      <form className="otp-input-form" onSubmit={(e) => e.preventDefault()}>
        <div className="otp-input-container">
          {Array.from({ length }, (_, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="tel"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              data-test-id="otp-text-box"
              className={cn('otp__input', 'input', error && 'otp__input--error')}
              value={digits[i] ?? ''}
              disabled={disabled}
              autoFocus={i === 0}
              style={{
                caretColor: 'transparent',
                pointerEvents: i === 0 || Boolean(digits[i - 1]) ? 'auto' : 'none',
              }}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              aria-label={`OTP digit ${i + 1}`}
            />
          ))}
        </div>
      </form>
    </div>
  );
}
