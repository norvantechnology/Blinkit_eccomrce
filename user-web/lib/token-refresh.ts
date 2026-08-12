import axios from 'axios';
import {
  setTokens,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getAccessTokenExpiresAt,
  type AuthTokens,
} from '@/lib/auth';
import { getDeviceId } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const REFRESH_BUFFER_MS = 2 * 60 * 1000;
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

export async function refreshUserTokens(): Promise<AuthTokens | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken,
        deviceId: getDeviceId(),
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
  const tokens = await refreshUserTokens();
  return tokens !== null;
}

export function forceLogout() {
  clearSession();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

export const SESSION_REFRESH_CHECK_MS = REFRESH_CHECK_INTERVAL_MS;
