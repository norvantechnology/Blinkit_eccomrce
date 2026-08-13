import apiClient from '@/lib/api-client';
import { getDeviceId } from '@/lib/utils';
import type { AuthTokens, UserProfile } from '@/lib/auth';

export type AuthResult = { user: UserProfile; tokens: AuthTokens };

export const authService = {
  sendOtp: (phone: string) => apiClient.post('/auth/otp/send', { phone }),

  verifyOtp: async (phone: string, otp: string): Promise<AuthResult> => {
    const { data } = await apiClient.post('/auth/otp/verify', {
      phone,
      otp,
      deviceId: getDeviceId(),
      platform: 'web',
    });
    return data.data as AuthResult;
  },

  loginEmail: async (email: string, password: string): Promise<AuthResult> => {
    const { data } = await apiClient.post('/auth/login/email', {
      email,
      password,
      deviceId: getDeviceId(),
      platform: 'web',
    });
    return data.data as AuthResult;
  },

  loginGoogle: async (idToken: string): Promise<AuthResult> => {
    const { data } = await apiClient.post('/auth/oauth/google', {
      idToken,
      deviceId: getDeviceId(),
      platform: 'web',
    });
    return data.data as AuthResult;
  },

  loginApple: async (payload: {
    idToken: string;
    email?: string;
    name?: string;
  }): Promise<AuthResult> => {
    const { data } = await apiClient.post('/auth/oauth/apple', {
      idToken: payload.idToken,
      email: payload.email,
      name: payload.name,
      deviceId: getDeviceId(),
      platform: 'web',
    });
    return data.data as AuthResult;
  },

  register: async (payload: { name: string; email?: string; phone?: string }) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data.user as UserProfile;
  },

  logout: () =>
    apiClient.post('/auth/logout', { deviceId: getDeviceId() }).catch(() => undefined),

  deleteAccount: () => apiClient.delete('/auth/account'),

  setPassword: async (password: string) => {
    const { data } = await apiClient.post('/auth/password', { password });
    return data.data.user as UserProfile;
  },
};
