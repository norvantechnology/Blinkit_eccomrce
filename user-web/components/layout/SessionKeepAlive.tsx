'use client';

import { useEffect } from 'react';
import {
  ensureValidAccessToken,
  SESSION_REFRESH_CHECK_MS,
} from '@/lib/token-refresh';
import { isAuthenticated } from '@/lib/auth';

export function SessionKeepAlive() {
  useEffect(() => {
    if (!isAuthenticated()) return;

    const tick = () => {
      void ensureValidAccessToken();
    };

    tick();
    const id = window.setInterval(tick, SESSION_REFRESH_CHECK_MS);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
