import { useAuthStore } from '@/store/authStore';

export const hasPermission = (permission: string): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.permissions.includes(permission);
};

export const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some(hasPermission);
};
