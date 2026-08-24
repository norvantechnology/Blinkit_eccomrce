'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLocaleStore } from '@/store/localeStore';
import { usersService } from '@/services/users.service';
import { setStoredUser } from '@/lib/auth';
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
  const setUser = useAuthStore((s) => s.setUser);
  const locale = useLocaleStore((s) => s.locale);
  const setLocaleState = useLocaleStore((s) => s.setLocale);

  useEffect(() => {
    setStoredLocale(locale);
  }, [locale]);

  const setLanguage = useCallback(
    async (next: Locale) => {
      const normalized = normalizeLocale(next);
      setStoredLocale(normalized);
      setLocaleState(normalized);
      if (!user) return;
      try {
        const updated = await usersService.updateLanguage(normalized);
        setUser(updated);
        setStoredUser(updated);
      } catch {
        /* keep local selection if API fails */
      }
    },
    [setLocaleState, setUser, user],
  );

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  return { locale, t, locales: LOCALES, setLanguage };
}
