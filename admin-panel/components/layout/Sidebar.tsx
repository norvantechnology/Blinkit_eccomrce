'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import PermissionGate from '@/components/guards/PermissionGate';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { NAV_ITEMS, type NavItem } from '@/lib/nav-config';
import { getNavIcon } from '@/lib/nav-icons';
import { hasAnyPermission } from '@/lib/rbac';
import { cn } from '@/lib/utils';

function filterNavByPermissions(items: NavItem[]): NavItem[] {
  const filtered: NavItem[] = [];
  for (const item of items) {
    const children = item.children ? filterNavByPermissions(item.children) : undefined;
    const selfAllowed = !item.permissions || hasAnyPermission(item.permissions);
    const childAllowed = Boolean(children?.length);
    if (!selfAllowed && !childAllowed) continue;
    filtered.push({
      ...item,
      ...(children?.length ? { children } : { children: undefined }),
    });
  }
  return filtered;
}

function NavLink({
  item,
  onNavigate,
  depth = 0,
}: {
  item: NavItem;
  onNavigate?: () => void;
  depth?: number;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(
    pathname === item.href || pathname.startsWith(item.href + '/'),
  );
  const Icon = getNavIcon(item.href);
  const isActive = pathname === item.href;
  const isParentActive = pathname.startsWith(item.href + '/');
  const hasChildren = Boolean(item.children?.length);

  const linkBody = hasChildren ? (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'flex w-full min-h-[44px] items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors',
          isParentActive || isActive
            ? 'border-[var(--border)] bg-[var(--primary-muted)] text-[var(--primary)]'
            : 'text-[#363636] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]',
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0',
            isParentActive || isActive ? 'text-[var(--primary)]' : 'text-[#999]',
          )}
          strokeWidth={2}
        />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[#999] transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-3 space-y-0.5 border-l-2 border-[var(--border)] pl-2 pt-0.5">
            {item.children!.map((child) => (
              <NavLink key={child.href} item={child} onNavigate={onNavigate} depth={depth + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group flex min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
        depth > 0 && 'min-h-[40px] py-2 text-[13px]',
        isActive
          ? 'border-[var(--primary)]/25 bg-[var(--primary)] text-white shadow-sm'
          : 'border-transparent text-[#363636] hover:border-[var(--border)] hover:bg-[var(--surface-muted)]',
      )}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0',
          depth > 0 && 'h-4 w-4',
          isActive ? 'text-white' : 'text-[#999] group-hover:text-[#666]',
        )}
        strokeWidth={2}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );

  // Dynamic PermissionGate from nav-config permissions (§19)
  if (!item.permissions?.length) {
    return linkBody;
  }

  return (
    <PermissionGate anyOf={item.permissions} fallback={null}>
      {linkBody}
    </PermissionGate>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const visibleNav = useMemo(() => filterNavByPermissions(NAV_ITEMS), [user]);
  const closeMobile = () => setSidebarOpen(false);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/60 transition-opacity duration-200 lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeMobile}
        aria-hidden={!sidebarOpen}
      />

      <aside
        className={cn(
          'flex w-[var(--sidebar-width)] shrink-0 flex-col border-r border-[var(--border-strong)] bg-[var(--sidebar-bg)] shadow-[2px_0_8px_var(--shadow-color)]',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[min(17.5rem,90vw)]',
          'max-lg:transition-transform max-lg:duration-200 max-lg:ease-out safe-top safe-bottom',
          sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 sm:h-16">
          <Link href="/dashboard" onClick={closeMobile}>
            <BrandLogo size="sm" showSubtitle={false} />
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-slate-600 transition hover:bg-[var(--surface-muted)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
          {visibleNav.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={closeMobile} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
          <p className="text-center text-[11px] font-medium text-[var(--muted)]">
            © 2026 Tapi Grocery Admin
          </p>
          <p className="text-center text-[10px] text-[#999]">Version 1.0.0</p>
        </div>
      </aside>
    </>
  );
}
