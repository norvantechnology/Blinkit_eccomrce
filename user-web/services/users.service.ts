import apiClient from '@/lib/api-client';
import type { UserProfile } from '@/lib/auth';

export const usersService = {
  getMe: async () => {
    const { data } = await apiClient.get('/users/me');
    return data.data.user as UserProfile;
  },

  updateMe: async (payload: {
    name?: string;
    email?: string;
    avatarUrl?: string | null;
    languagePref?: string;
  }) => {
    const { data } = await apiClient.patch('/users/me', payload);
    return data.data.user as UserProfile;
  },

  updateLanguage: async (languagePref: string) => {
    const { data } = await apiClient.patch('/users/me/language', { languagePref });
    return data.data.user as UserProfile;
  },
};
