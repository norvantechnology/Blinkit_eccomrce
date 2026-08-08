import { create } from 'zustand';

interface UiState {
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  locationPickerOpen: boolean;
  setLocationPickerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  loginOpen: false,
  setLoginOpen: (loginOpen) => set({ loginOpen }),
  locationPickerOpen: false,
  setLocationPickerOpen: (locationPickerOpen) => set({ locationPickerOpen }),
}));
