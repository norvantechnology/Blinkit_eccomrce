import apiClient from '@/lib/api-client';

export type CountryCode = {
  id: string | null;
  name: string;
  isoCode: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  isDefault: boolean;
};

export const DEFAULT_COUNTRY: CountryCode = {
  id: null,
  name: 'India',
  isoCode: 'IN',
  dialCode: '+91',
  minLength: 10,
  maxLength: 10,
  isDefault: true,
};

export const flagUrl = (isoCode: string) =>
  `https://flagcdn.com/w40/${isoCode.toLowerCase()}.png`;

export const countryCodesService = {
  list: async (): Promise<CountryCode[]> => {
    const { data } = await apiClient.get('/country-codes');
    const rows = (data?.data || []) as CountryCode[];
    return rows.length ? rows : [DEFAULT_COUNTRY];
  },
};
