import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, setUser, logout } = useAuthStore();
  return { user, setUser, logout, isAuthenticated: !!user };
}
