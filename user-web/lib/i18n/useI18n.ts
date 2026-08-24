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

/** True when the user (or a prior session) explicitly saved a language. */
export function hasStoredLocale(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) != null;
  } catch {
    return false;
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
      if (user) {
        setUser({ ...user, languagePref: normalized });
        setStoredUser({ ...user, languagePref: normalized });
      }
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
