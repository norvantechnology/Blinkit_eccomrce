import apiClient from '@/lib/api-client';
import { getDeviceId } from '@/lib/utils';
import type { AuthTokens, UserProfile } from '@/lib/auth';

export type AuthResult = { user: UserProfile; tokens: AuthTokens };

export type OtpChannel = { phone: string; email?: never } | { email: string; phone?: never };

export type SendOtpResult = {
  message?: string;
  otp?: string;
  staticOtp?: boolean;
};

export const authService = {
  sendOtp: async (channel: OtpChannel): Promise<SendOtpResult> => {
    const { data } = await apiClient.post('/auth/otp/send', channel);
    return (data?.data || {}) as SendOtpResult;
  },

  verifyOtp: async (channel: OtpChannel, otp: string): Promise<AuthResult> => {
    const { data } = await apiClient.post('/auth/otp/verify', {
      ...channel,
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

  sendDeleteOtp: async () => {
    const { data } = await apiClient.post('/auth/account/delete-otp');
    return data.data as { message?: string; otp?: string; staticOtp?: boolean };
  },

  deleteAccount: (otp: string) => apiClient.delete('/auth/account', { data: { otp } }),
};
