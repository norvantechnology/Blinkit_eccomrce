import { create } from 'zustand';
import { blinkitTokens } from '@/lib/design-tokens';

export interface SelectedLocation {
  label: string;
  fullAddress: string;
  lat: number;
  lng: number;
  etaMinutes: number;
}

interface LocationState {
  location: SelectedLocation | null;
  loading: boolean;
  setLocation: (location: SelectedLocation | null) => void;
  setLoading: (loading: boolean) => void;
  setDefaultStoreLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  loading: false,
  setLocation: (location) => set({ location }),
  setLoading: (loading) => set({ loading }),
  setDefaultStoreLocation: () =>
    set({
      location: {
        label: 'Home',
        fullAddress: blinkitTokens.defaultStore.fullAddress,
        lat: blinkitTokens.defaultStore.lat,
        lng: blinkitTokens.defaultStore.lng,
        etaMinutes: blinkitTokens.defaultStore.etaMinutes,
      },
    }),
}));
