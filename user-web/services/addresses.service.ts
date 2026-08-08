import apiClient from '@/lib/api-client';

export type AddressLabel = 'home' | 'work' | 'other';

export interface Address {
  id: string;
  userId: string;
  label: AddressLabel;
  fullAddress: string;
  landmark: string | null;
  isDefault: boolean;
  lat: number | null;
  lng: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressInput {
  label: AddressLabel;
  fullAddress: string;
  lat: number;
  lng: number;
  landmark?: string;
  isDefault?: boolean;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  fullAddress: string;
  lat: number | null;
  lng: number | null;
}

export const addressesService = {
  list: async () => {
    const { data } = await apiClient.get('/addresses');
    return (data.data.addresses || []) as Address[];
  },

  create: async (payload: AddressInput) => {
    const { data } = await apiClient.post('/addresses', payload);
    return data.data.address as Address;
  },

  update: async (id: string, payload: Partial<AddressInput>) => {
    const { data } = await apiClient.patch(`/addresses/${id}`, payload);
    return data.data.address as Address;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/addresses/${id}`);
  },

  setDefault: async (id: string) => {
    const { data } = await apiClient.patch(`/addresses/${id}/default`);
    return data.data.address as Address;
  },

  search: async (q: string) => {
    const { data } = await apiClient.get('/addresses/search', { params: { q } });
    return (data.data.results || []) as PlaceSuggestion[];
  },
};
