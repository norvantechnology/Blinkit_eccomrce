'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import apiClient from '@/lib/api-client';

function getInitials(name?: string) {
  if (!name) return 'A';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/catalog': 'Catalog',
  '/orders': 'Orders',
  '/promotions': 'Promotions',
  '/payments': 'Payments',
  '/reports': 'Reports',
  '/support': 'Support',
  '/settings': 'Settings',
  '/audit-logs': 'Audit Logs',
};

function getPageTitle(pathname: string) {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + '/')) return title;
  }
  return 'Admin';
}

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/admin/auth/logout');
    } catch {
      // Session cleared locally even if API call fails
    }
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 sm:px-6 lg:px-8 safe-top">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="truncate text-[15px] font-semibold text-[var(--foreground)]">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="hidden h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] sm:flex"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" strokeWidth={1.85} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-2 transition-colors',
              'hover:bg-[var(--surface-muted)] sm:pr-2.5',
              menuOpen && 'bg-[var(--surface-muted)]',
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--primary)] text-[10px] font-bold text-white">
              {getInitials(user?.name)}
            </div>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[9rem] truncate text-xs font-semibold text-[var(--foreground)] md:max-w-[12rem]">
                {user?.name || 'Admin'}
              </p>
              <p className="max-w-[9rem] truncate text-[10px] capitalize text-[var(--muted)] md:max-w-[12rem]">
                {user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'hidden h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform sm:block',
                menuOpen && 'rotate-180',
              )}
            />
          </button>

          <div
            className={cn(
              'absolute right-0 top-full z-50 mt-1.5 w-48 origin-top-right rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-md',
              'transition-all duration-150',
              menuOpen
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0',
            )}
          >
            {user && (
              <div className="border-b border-[var(--border)] px-3 py-2 sm:hidden">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs capitalize text-[var(--muted)]">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
