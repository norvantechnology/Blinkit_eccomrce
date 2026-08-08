import { create } from 'zustand';
import { clearSession, type UserProfile } from '@/lib/auth';

interface AuthState {
  user: UserProfile | null;
  hydrated: boolean;
  setUser: (user: UserProfile | null) => void;
  setHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
  logout: () => {
    clearSession();
    set({ user: null });
  },
}));
