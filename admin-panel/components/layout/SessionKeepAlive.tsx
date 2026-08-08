'use client';

import { useEffect } from 'react';
import {
  ensureValidAccessToken,
  forceLogout,
  SESSION_REFRESH_CHECK_MS,
} from '@/lib/token-refresh';
import { getRefreshToken } from '@/lib/auth';

/**
 * Keeps the admin session alive: refreshes access tokens before expiry
 * and on page load when only the refresh token is still valid.
 */
export default function SessionKeepAlive() {
  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      if (!getRefreshToken()) return;
      const ok = await ensureValidAccessToken();
      if (!active) return;
      if (!ok) forceLogout();
    };

    syncSession();

    const intervalId = window.setInterval(syncSession, SESSION_REFRESH_CHECK_MS);

    const onFocus = () => syncSession();
    window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return null;
}
