'use client';

import { useEffect } from 'react';
import { getStoredUser, isAuthenticated, clearSession, setStoredUser } from '@/lib/auth';
import { ensureValidAccessToken } from '@/lib/token-refresh';
import { useAuthStore } from '@/store/authStore';
import { useLocaleStore } from '@/store/localeStore';
import { usersService } from '@/services/users.service';
import { normalizeLocale } from '@/lib/i18n/messages';
import { getStoredLocale, setStoredLocale } from '@/lib/i18n/useI18n';

export function AuthHydration({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const setLocale = useLocaleStore((s) => s.setLocale);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = getStoredUser();
        if (stored) {
          setUser(stored);
          const loc = normalizeLocale(stored.languagePref || getStoredLocale());
          setStoredLocale(loc);
          setLocale(loc);
        } else {
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
              if (!cancelled) {
                setUser(me);
                setStoredUser(me);
                const loc = normalizeLocale(me.languagePref);
                setStoredLocale(loc);
                setLocale(loc);
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
