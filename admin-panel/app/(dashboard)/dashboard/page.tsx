'use client';

import Link from 'next/link';
import { Users, ShoppingCart, IndianRupee, Package, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import PermissionGate from '@/components/guards/PermissionGate';

const STATS = [
  {
    label: 'Total Users',
    value: '—',
    note: 'Milestone 4',
    icon: Users,
    permission: 'customers.view',
  },
  {
    label: 'Orders Today',
    value: '—',
    note: 'Milestone 3',
    icon: ShoppingCart,
    permission: 'orders.view',
  },
  {
    label: 'Revenue',
    value: '—',
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
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    permission: 'orders.view',
  },
  {
    label: 'Customers',
    href: '/users/customers',
    icon: Users,
    permission: 'customers.view',
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PermissionGate permission="dashboard.view" fallback={
        <PageHeader
          title="Dashboard"
          description="You do not have permission to view the dashboard."
        />
      }>
        <PageHeader
          title="Dashboard"
          description="Overview of Tapi Grocery. Full KPIs will be available in Milestone 4."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <PermissionGate key={stat.label} permission={stat.permission}>
                <Card padding="md" hover>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--primary-muted)]">
                      <Icon className="h-[18px] w-[18px] text-[var(--primary)]" strokeWidth={2} />
                    </div>
                    <span className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {stat.note}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {stat.value}
                  </p>
                </Card>
              </PermissionGate>
            );
          })}
        </div>

        <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:mt-8 sm:p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
            Quick access
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <PermissionGate key={link.href} permission={link.permission}>
                  <Link
                    href={link.href}
                    className="flex min-h-[52px] items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 transition-colors hover:border-[var(--border-strong)] hover:bg-white"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white">
                      <Icon className="h-[18px] w-[18px] text-[var(--primary)]" strokeWidth={2} />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-slate-700">{link.label}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
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
