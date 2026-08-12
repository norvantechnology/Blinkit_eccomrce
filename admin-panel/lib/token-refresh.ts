import axios from 'axios';
import {
  setTokens,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getAccessTokenExpiresAt,
  type AuthTokens,
} from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

/** Refresh access token if it expires within this window (ms). */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** Background check interval while the admin panel is open. */
const REFRESH_CHECK_INTERVAL_MS = 60 * 1000;

let refreshPromise: Promise<AuthTokens | null> | null = null;

export function shouldRefreshAccessToken(): boolean {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const accessToken = getAccessToken();
  if (!accessToken) return true;

  const expiresAt = getAccessTokenExpiresAt();
  if (!expiresAt) return true;

  return Date.now() >= expiresAt - REFRESH_BUFFER_MS;
}

export async function refreshAdminTokens(): Promise<AuthTokens | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const { data } = await axios.post(`${API_URL}/admin/auth/refresh-token`, {
        refreshToken,
      });
      const tokens = data.data.tokens as AuthTokens;
      setTokens(tokens);
      return tokens;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function ensureValidAccessToken(): Promise<boolean> {
  if (!shouldRefreshAccessToken()) return true;
  const tokens = await refreshAdminTokens();
  return tokens !== null;
}

export function forceLogout() {
  clearSession();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

export const SESSION_REFRESH_CHECK_MS = REFRESH_CHECK_INTERVAL_MS;
