'use client';

import { hasPermission, hasAnyPermission } from '@/lib/rbac';

interface PermissionGateProps {
  /** Single permission key (e.g. customers.view) */
  permission?: string;
  /** Pass if any of these permissions is enough */
  anyOf?: string[];
  /** Pass only if all of these permissions are present */
  allOf?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RBAC gate for UI actions/sections.
 * Backend authorize() remains the security boundary - this is UX only.
 *
 * Usage:
 *   <PermissionGate permission="orders.refund">...</PermissionGate>
 *   <PermissionGate anyOf={['customers.view', 'customers.manage']}>...</PermissionGate>
 */
export default function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyOf?.length) {
    allowed = hasAnyPermission(anyOf);
  } else if (allOf?.length) {
    allowed = allOf.every(hasPermission);
  }

  if (!allowed) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
