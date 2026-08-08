import { ShieldCheck, BarChart3, Users, Package, Truck } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  { icon: BarChart3, label: 'Real-time operations overview' },
  { icon: Users, label: 'Team and role management' },
  { icon: ShieldCheck, label: 'Secure admin access' },
];

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthShell({ children, title, description }: AuthShellProps) {
  return (
    <div className="flex min-h-screen min-h-dvh flex-col bg-[var(--background)] lg:flex-row">
      {/* Brand panel — Tapi Grocery green (matches user-web cart green) */}
      <aside
        className={cn(
          'relative hidden flex-col justify-between overflow-hidden',
          'border-r border-[var(--primary)]/20 bg-[var(--primary)]',
          'md:flex md:w-[38%] md:max-w-sm md:p-7 lg:w-full lg:max-w-md lg:p-8 xl:max-w-lg xl:p-10',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(248,203,70,0.35),_transparent_55%)]" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-[var(--brand-yellow)]/20 blur-3xl" />

        <div className="relative">
          <BrandLogo size="lg" inverted showSubtitle />
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-10">
          <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-white xl:text-3xl">
            Manage your store with clarity and control.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
            Orders, inventory, team access, and reporting — organized in one admin workspace.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4 text-sm font-medium text-white">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-[var(--brand-yellow)] shadow-sm">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-12 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-[2px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-[#1f1f1f]">
              <Package className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-yellow)]">
                Store operations
              </p>
              <p className="mt-0.5 truncate text-sm text-white/80">
                Inventory · Delivery · Team access
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/70">
              <Truck className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
          </div>
        </div>

        <footer className="relative space-y-0.5 text-xs text-white/60">
          <p className="font-medium text-white/85">© 2026 Tapi Grocery Admin</p>
          <p className="text-white/50">Version 1.0.0</p>
        </footer>
      </aside>

      <div
        className={cn(
          'flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-10',
          'justify-center lg:justify-start lg:pt-[max(4rem,calc(50vh-14rem))]',
        )}
      >
        <div className="mb-6 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm md:hidden">
          <BrandLogo size="md" className="justify-center" />
        </div>

        <div className="w-full max-w-md md:max-w-lg lg:max-w-md">
          <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-center sm:px-5 lg:text-left">
            <h1 className="text-xl font-extrabold tracking-tight text-[#1f1f1f] sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>

          <Card padding="lg" className="border-[var(--border)] shadow-md shadow-[rgba(31,31,31,0.06)]">
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
}
