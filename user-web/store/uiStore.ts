import { create } from 'zustand';

export type LocationAnchor = {
  top: number;
  left: number;
  bottom: number;
  width: number;
  right: number;
};

interface UiState {
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  locationPickerOpen: boolean;
  locationAnchor: LocationAnchor | null;
  setLocationPickerOpen: (open: boolean, anchor?: LocationAnchor | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  loginOpen: false,
  setLoginOpen: (loginOpen) => set({ loginOpen }),
  locationPickerOpen: false,
  locationAnchor: null,
  setLocationPickerOpen: (locationPickerOpen, anchor = null) =>
    set({
      locationPickerOpen,
      locationAnchor: locationPickerOpen ? anchor ?? null : null,
    }),
}));
