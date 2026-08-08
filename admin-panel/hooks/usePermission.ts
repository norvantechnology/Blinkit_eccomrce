import { hasPermission, hasAnyPermission } from '@/lib/rbac';

export function usePermission(permission: string) {
  return hasPermission(permission);
}

export function useAnyPermission(permissions: string[]) {
  return hasAnyPermission(permissions);
}
