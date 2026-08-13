import apiClient from '@/lib/api-client';

export type PrivacyPolicyContent = {
  locale: string;
  title: string;
  markdown: string;
  excerpt: string;
};

export const contentService = {
  getPrivacyPolicy: async (locale: 'en' | 'hi' = 'en') => {
    const { data } = await apiClient.get('/content/privacy-policy', {
      params: { locale },
    });
    return data.data as PrivacyPolicyContent;
  },
};
