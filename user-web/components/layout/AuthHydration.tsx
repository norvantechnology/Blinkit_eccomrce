'use client';

import { useEffect } from 'react';
import { getStoredUser, isAuthenticated, setStoredUser } from '@/lib/auth';
import { ensureValidAccessToken } from '@/lib/token-refresh';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';

export function AuthHydration({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = getStoredUser();
      if (stored) setUser(stored);

      if (isAuthenticated()) {
        const ok = await ensureValidAccessToken();
        if (ok && !cancelled) {
          try {
            const me = await usersService.getMe();
            if (!cancelled) {
              setUser(me);
              setStoredUser(me);
            }
          } catch {
            /* keep stored user if offline / soft fail */
          }
        }
      }

      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser, setHydrated]);

  return <>{children}</>;
}
