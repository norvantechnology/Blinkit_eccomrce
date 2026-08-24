import { create } from 'zustand';
import { normalizeLocale, type Locale } from '@/lib/i18n/messages';

const STORAGE_KEY = 'tapi_language_pref';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    return normalizeLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'en';
  }
}

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  hydrateFromStorage: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'en',
  hydrated: false,
  setLocale: (locale) => set({ locale: normalizeLocale(locale) }),
  hydrateFromStorage: () =>
    set({
      locale: readStoredLocale(),
      hydrated: true,
    }),
}));
