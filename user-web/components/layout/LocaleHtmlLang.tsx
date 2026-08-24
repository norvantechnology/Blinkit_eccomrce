'use client';

import { useEffect } from 'react';
import { useLocaleStore } from '@/store/localeStore';
import { setStoredLocale } from '@/lib/i18n/useI18n';

/** Keeps <html lang="…"> in sync with the selected language. */
export function LocaleHtmlLang() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    setStoredLocale(locale);
  }, [locale]);

  return null;
}
