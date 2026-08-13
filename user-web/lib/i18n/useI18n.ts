'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  LOCALES,
  normalizeLocale,
  translate,
  type Locale,
  type MessageKey,
} from './messages';

const STORAGE_KEY = 'tapi_language_pref';

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    return normalizeLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'en';
  }
}

export function setStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}

export function useI18n() {
  const user = useAuthStore((s) => s.user);
  const locale = useMemo(
    () => normalizeLocale(user?.languagePref || getStoredLocale()),
    [user?.languagePref],
  );

  useEffect(() => {
    setStoredLocale(locale);
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  return { locale, t, locales: LOCALES };
}
