'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { normalizeLocale } from '@/lib/i18n/messages';
import { getStoredLocale, setStoredLocale } from '@/lib/i18n/useI18n';

/** Keeps <html lang="…"> in sync with user language preference. */
export function LocaleHtmlLang() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const locale = normalizeLocale(user?.languagePref || getStoredLocale());
    setStoredLocale(locale);
  }, [user?.languagePref]);

  return null;
}
