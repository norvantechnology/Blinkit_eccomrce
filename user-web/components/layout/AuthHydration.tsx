'use client';

import { useEffect, useLayoutEffect } from 'react';
import { getStoredUser, isAuthenticated, clearSession, setStoredUser } from '@/lib/auth';
import { ensureValidAccessToken } from '@/lib/token-refresh';
import { useAuthStore } from '@/store/authStore';
import { useLocaleStore } from '@/store/localeStore';
import { usersService } from '@/services/users.service';
import { normalizeLocale } from '@/lib/i18n/messages';
import { getStoredLocale, hasStoredLocale, setStoredLocale } from '@/lib/i18n/useI18n';

export function AuthHydration({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const hydrateFromStorage = useLocaleStore((s) => s.hydrateFromStorage);

  // Apply stored language before paint so account hub / header don't flash English.
  useLayoutEffect(() => {
    if (hasStoredLocale()) {
      hydrateFromStorage();
      setStoredLocale(getStoredLocale());
    }
  }, [hydrateFromStorage]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
          if (!hasStoredLocale() && stored.languagePref) {
            const loc = normalizeLocale(stored.languagePref);
            setStoredLocale(loc);
            setLocale(loc);
          } else if (hasStoredLocale()) {
            const loc = getStoredLocale();
            setStoredLocale(loc);
            setLocale(loc);
          }
        } else if (hasStoredLocale()) {
          const loc = getStoredLocale();
          setStoredLocale(loc);
          setLocale(loc);
        }

        if (isAuthenticated()) {
          const ok = await ensureValidAccessToken();
          if (!ok) {
            clearSession();
            if (!cancelled) setUser(null);
          } else if (!cancelled) {
            try {
              const me = await usersService.getMe();
              if (cancelled) return;
              setUser(me);
              setStoredUser(me);

              const serverLoc = normalizeLocale(me.languagePref);
              if (hasStoredLocale()) {
                const latestLocal = getStoredLocale();
                setLocale(latestLocal);
                setStoredLocale(latestLocal);
                // Keep server in sync with the user's latest UI choice.
                if (latestLocal !== serverLoc) {
                  try {
                    const updated = await usersService.updateLanguage(latestLocal);
                    if (!cancelled) {
                      setUser(updated);
                      setStoredUser(updated);
                    }
                  } catch {
                    /* keep local locale */
                  }
                }
              } else {
                setLocale(serverLoc);
                setStoredLocale(serverLoc);
              }
            } catch {
              /* keep stored user if offline / getMe fail */
            }
          }
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser, setHydrated, setLocale]);

  return <>{children}</>;
}
