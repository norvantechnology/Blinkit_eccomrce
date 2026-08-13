import apiClient from '@/lib/api-client';

export type PrivacyPolicyContent = {
  locale: string;
  title: string;
  markdown: string;
  excerpt: string;
};

export const storeSettingsService = {
  getPrivacyPolicy: async () => {
    const { data } = await apiClient.get('/admin/store-settings/privacy-policy');
    return data.data as { en: PrivacyPolicyContent; hi: PrivacyPolicyContent };
  },

  updatePrivacyPolicy: async (locale: 'en' | 'hi', markdown: string) => {
    const { data } = await apiClient.patch('/admin/store-settings/privacy-policy', {
      locale,
      markdown,
    });
    return data.data as PrivacyPolicyContent;
  },
};
