'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { LOCALES, type Locale } from '@/lib/i18n/messages';
import { useI18n } from '@/lib/i18n/useI18n';
import { useUiStore } from '@/store/uiStore';

export function LanguageSelect({ className }: { className?: string }) {
  const { locale, setLanguage, t } = useI18n();
  const accountDropdownOpen = useUiStore((s) => s.accountDropdownOpen);
  const locationPickerOpen = useUiStore((s) => s.locationPickerOpen);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  useEffect(() => {
    if (accountDropdownOpen || locationPickerOpen) setOpen(false);
  }, [accountDropdownOpen, locationPickerOpen]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (code: Locale) => {
    setOpen(false);
    if (code !== locale) void setLanguage(code);
  };

  return (
    <div ref={ref} className={cn('bk-lang', className)}>
      <button
        type="button"
        className={cn('bk-lang__btn', open && 'is-open')}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('header.language')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bk-lang__code">{locale === 'hi' ? 'हि' : 'EN'}</span>
        <span className={cn('bk-lang__caret', open && 'is-open')} aria-hidden />
      </button>
      {open ? (
        <ul className="bk-lang__menu" role="listbox" aria-label={t('header.language')}>
          {LOCALES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang.code === locale}
                className={cn('bk-lang__opt', lang.code === current.code && 'is-on')}
                onClick={() => pick(lang.code)}
              >
                {lang.nativeLabel}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
