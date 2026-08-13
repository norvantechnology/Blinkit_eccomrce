export interface UserProfile {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  avatarUrl?: string | null;
  languagePref: string;
  authProvider: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;
const USER_KEY = 'userProfile';

const setCookie = (name: string, value: string, maxAge: number) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const clearCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
};

export const setTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  setCookie('accessToken', tokens.accessToken, ACCESS_MAX_AGE);
  setCookie('refreshToken', tokens.refreshToken, REFRESH_MAX_AGE);
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  clearCookie('accessToken');
  clearCookie('refreshToken');
};

export const setSession = (user: UserProfile, tokens: AuthTokens) => {
  setTokens(tokens);
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearSession = () => {
  clearTokens();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
};

export const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: UserProfile) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

export const getAccessTokenExpiresAt = (): number | null => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken() || !!getRefreshToken();
};

export const getApiErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  const response = (err as { response?: { data?: { message?: string } } })?.response;
  const message = response?.data?.message;
  if (message && !message.includes('prisma') && !message.includes('Invalid `prisma')) {
    return message;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
};
