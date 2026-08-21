import { ShieldCheck, BarChart3, Users, Package, Truck } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
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
      <aside
        className={cn(
          'relative hidden flex-col justify-between overflow-hidden',
          'border-r border-[var(--border)] bg-[var(--primary)]',
          'md:flex md:w-[38%] md:max-w-sm md:p-8 lg:w-full lg:max-w-md lg:p-10',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(248,203,70,0.22),_transparent_55%)]" />

        <div className="relative">
          <BrandLogo size="lg" inverted showSubtitle />
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-12">
          <h2 className="text-2xl font-bold leading-snug tracking-tight text-white">
            Run your store with clarity.
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/75">
            Orders, inventory, team access, and reporting in one place.
          </p>

          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium text-white">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/12 text-[var(--brand-yellow)]">
                  <Icon className="h-4 w-4" strokeWidth={1.85} aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--brand-yellow)] text-[#1f1f1f]">
              <Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-yellow)]">
                Store operations
              </p>
              <p className="mt-0.5 truncate text-sm text-white/75">
                Inventory · Delivery · Team
              </p>
            </div>
            <Truck className="h-5 w-5 shrink-0 text-white/50" strokeWidth={1.75} aria-hidden />
          </div>
        </div>

        <footer className="relative text-xs text-white/55">
          <p>© 2026 Tapi Grocery Admin</p>
        </footer>
      </aside>

      <div
        className={cn(
          'flex flex-1 flex-col items-center px-4 py-8 sm:px-6',
          'justify-center lg:justify-start lg:pt-[max(3.5rem,calc(50vh-13rem))]',
        )}
      >
        <div className="mb-8 w-full max-w-md md:hidden">
          <BrandLogo size="md" className="justify-center" />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{title}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{description}</p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
