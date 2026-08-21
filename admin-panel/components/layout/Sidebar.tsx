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
          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
          isParentActive || isActive
            ? 'bg-[var(--primary-muted)] text-[var(--primary)]'
            : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            isParentActive || isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)]',
          )}
          strokeWidth={1.85}
        />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform duration-200',
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
          <div className="ml-3 space-y-0.5 border-l border-[var(--border)] pl-2.5">
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
        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
        depth > 0 && 'py-1.5 text-[12.5px]',
        isActive
          ? 'bg-[var(--primary)] text-white'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          depth > 0 && 'h-3.5 w-3.5',
          isActive ? 'text-white' : 'text-[var(--muted)]',
        )}
        strokeWidth={1.85}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );

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
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeMobile}
        aria-hidden={!sidebarOpen}
      />

      <aside
        className={cn(
          'flex w-[var(--sidebar-width)] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)]',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[min(16rem,88vw)]',
          'max-lg:shadow-lg max-lg:transition-transform max-lg:duration-200 max-lg:ease-out safe-top safe-bottom',
          sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <Link href="/dashboard" onClick={closeMobile} className="min-w-0">
            <BrandLogo size="sm" showSubtitle={false} />
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-muted)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
          {visibleNav.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={closeMobile} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
          <p className="text-[11px] text-[var(--muted)]">Tapi Grocery Admin · v1.0</p>
        </div>
      </aside>
    </>
  );
}
