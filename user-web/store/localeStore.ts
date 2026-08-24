import { create } from 'zustand';
import { normalizeLocale, type Locale } from '@/lib/i18n/messages';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale: normalizeLocale(locale) }),
}));
