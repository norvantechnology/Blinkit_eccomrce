import { create } from 'zustand';
import { clearSession } from '@/lib/auth';
import type { AdminUser } from '@/lib/auth';

interface AuthState {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    clearSession();
    set({ user: null });
  },
}));
