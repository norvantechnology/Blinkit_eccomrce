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
}

/** In-memory only - refresh clears location (no static / persisted pin). */
export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  loading: false,
  setLocation: (location) => set({ location }),
  setLoading: (loading) => set({ loading }),
}));

export function buildSelectedLocation(input: {
  label: string;
  fullAddress: string;
  lat: number;
  lng: number;
  etaMinutes?: number;
}): SelectedLocation {
  return {
    label: input.label,
    fullAddress: input.fullAddress,
    lat: input.lat,
    lng: input.lng,
    etaMinutes: input.etaMinutes ?? blinkitTokens.deliveryEtaMinutes,
  };
}
