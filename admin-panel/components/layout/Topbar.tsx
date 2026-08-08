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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--border-strong)] bg-[var(--surface)] px-3 shadow-sm sm:h-16 sm:gap-3 sm:px-5 safe-top">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0 border-[var(--border)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 sm:px-4 sm:py-2">
          <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {getPageTitle(pathname)}
          </h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            Store operations panel
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-slate-600 transition hover:border-[var(--border-strong)] hover:bg-white sm:flex"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex max-w-[10rem] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] py-1 pl-1 pr-2',
              'transition-colors hover:border-[var(--border-strong)] hover:bg-white sm:max-w-none sm:py-1.5 sm:pr-2.5',
              menuOpen && 'border-[var(--border-strong)] bg-white shadow-sm',
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--primary)]/20 bg-[var(--primary-muted)] text-xs font-bold text-[var(--primary)]">
              {getInitials(user?.name)}
            </div>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[7rem] truncate text-xs font-semibold text-slate-800 md:max-w-[10rem]">
                {user?.name || 'Admin'}
              </p>
              <p className="max-w-[7rem] truncate text-[10px] capitalize text-slate-500 md:max-w-[10rem]">
                {user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'hidden h-4 w-4 shrink-0 text-slate-400 transition-transform sm:block',
                menuOpen && 'rotate-180',
              )}
            />
          </button>

          <div
            className={cn(
              'absolute right-0 top-full z-50 mt-1.5 w-52 origin-top-right rounded-lg border border-[var(--border-strong)] bg-white p-1.5 shadow-lg',
              'transition-all duration-150',
              menuOpen
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0',
            )}
          >
            {user && (
              <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 sm:hidden">
                <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="truncate text-xs capitalize text-slate-500">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
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
