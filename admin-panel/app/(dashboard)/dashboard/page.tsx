'use client';

import Link from 'next/link';
import {
  Users,
  ShoppingCart,
  IndianRupee,
  Package,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import PermissionGate from '@/components/guards/PermissionGate';
import { useAuthStore } from '@/store/authStore';

const STATS = [
  {
    label: 'Total users',
    value: '-',
    note: 'Milestone 4',
    icon: Users,
    permission: 'customers.view',
  },
  {
    label: 'Orders today',
    value: '-',
    note: 'Milestone 3',
    icon: ShoppingCart,
    permission: 'orders.view',
  },
  {
    label: 'Revenue',
    value: '-',
    note: 'Milestone 4',
    icon: IndianRupee,
    permission: 'reports.view',
  },
];

const QUICK_LINKS = [
  {
    label: 'Products',
    href: '/catalog/products',
    icon: Package,
    permission: 'products.view',
    hint: 'Catalog & inventory',
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    permission: 'orders.view',
    hint: 'Fulfillment queue',
  },
  {
    label: 'Customers',
    href: '/users/customers',
    icon: Users,
    permission: 'customers.view',
    hint: 'People & accounts',
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="w-full">
      <PermissionGate
        permission="dashboard.view"
        fallback={
          <PageHeader
            title="Dashboard"
            description="You do not have permission to view the dashboard."
          />
        }
      >
        <header className="mb-6 flex flex-col gap-1 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Good to see you, {firstName}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Store overview · KPIs unlock in later milestones
            </p>
          </div>
          <p className="shrink-0 text-sm font-medium text-[var(--muted)]">{today}</p>
        </header>

        <section className="mb-7">
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <PermissionGate key={stat.label} permission={stat.permission}>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary-muted)] text-[var(--primary)]">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <span className="text-[11px] font-medium text-[var(--muted)]">{stat.note}</span>
                    </div>
                    <p className="mt-4 text-sm text-[var(--muted)]">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">
                      {stat.value}
                    </p>
                  </div>
                </PermissionGate>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Quick access</h2>
            <p className="text-xs text-[var(--muted)]">Everyday workflows</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <PermissionGate key={link.href} permission={link.permission}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--primary)]/35 hover:bg-[var(--primary-muted)]/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)]">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{link.label}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{link.hint}</p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--primary)]"
                      strokeWidth={2}
                    />
                  </Link>
                </PermissionGate>
              );
            })}
          </div>
        </section>
      </PermissionGate>
    </div>
  );
}
