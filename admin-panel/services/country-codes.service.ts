import apiClient from '@/lib/api-client';

export type CountryCode = {
  id: string;
  name: string;
  isoCode: string;
  dialCode: string;
  flag: string | null;
  minLength: number;
  maxLength: number;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
};

export type CountryCodeInput = Omit<CountryCode, 'id' | 'flag'>;

export const flagUrl = (isoCode: string) =>
  `https://flagcdn.com/w40/${isoCode.toLowerCase()}.png`;

export const countryCodesService = {
  list: async () => {
    const { data } = await apiClient.get('/admin/country-codes');
    return data.data as CountryCode[];
  },

  create: async (input: CountryCodeInput) => {
    const { data } = await apiClient.post('/admin/country-codes', input);
    return data.data as CountryCode;
  },

  update: async (id: string, input: Partial<CountryCodeInput>) => {
    const { data } = await apiClient.patch(`/admin/country-codes/${id}`, input);
    return data.data as CountryCode;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/admin/country-codes/${id}`);
  },
};
