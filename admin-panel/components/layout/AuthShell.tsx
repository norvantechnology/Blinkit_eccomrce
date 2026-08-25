import { ShieldCheck, BarChart3, Users, Package, Truck, Sparkles } from 'lucide-react';
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
    <div
      className={cn(
        'relative flex min-h-screen min-h-dvh flex-col overflow-hidden',
        'bg-[var(--background)] lg:flex-row',
      )}
    >
      {/* Soft atmosphere (not flat grey) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(248,203,70,0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 0% 100%, rgba(12,131,31,0.12), transparent 50%)',
        }}
      />

      <aside
        className={cn(
          'relative hidden flex-col justify-between overflow-hidden text-white',
          'md:flex md:w-[40%] md:max-w-sm md:p-8 lg:w-full lg:max-w-[26rem] lg:p-10',
        )}
        style={{
          background:
            'linear-gradient(165deg, var(--auth-panel) 0%, var(--auth-panel-mid) 48%, #0c831f 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(248,203,70,0.25), transparent 40%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.08), transparent 35%)',
          }}
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--brand-yellow)]/15 blur-2xl"
          aria-hidden
        />

        {/* Logo on white plate so wordmark is always readable */}
        <div className="relative">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-md)]">
            <BrandLogo size="lg" showSubtitle={false} />
            <div className="hidden min-w-0 border-l border-[var(--border)] pl-3 sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                Admin
              </p>
              <p className="text-xs font-medium text-[var(--muted)]">Store console</p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-12">
          <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-yellow)] ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Operations hub
          </div>
          <h2 className="text-2xl font-bold leading-snug tracking-tight text-white lg:text-[1.7rem]">
            Run your store with clarity.
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/75">
            Orders, inventory, team access, and reporting in one calm workspace.
          </p>

          <ul className="mt-10 space-y-2.5">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 backdrop-blur-[2px]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-[#1f1f1f]">
                  <Icon className="h-4 w-4" strokeWidth={1.85} aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-yellow)] text-[#1f1f1f]">
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
          'justify-center lg:justify-start lg:pt-[max(3rem,calc(50vh-14rem))]',
        )}
      >
        {/* Mobile logo — white card, never on green */}
        <div className="mb-7 w-full max-w-md md:hidden">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
            <BrandLogo size="md" showSubtitle={false} />
            <div className="border-l border-[var(--border)] pl-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                Admin
              </p>
            </div>
          </div>
        </div>

        <div className="animate-auth-card w-full max-w-md">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-[1.65rem]">
              {title}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{description}</p>
          </div>

          <div
            className={cn(
              'rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]',
              'p-6 shadow-[var(--shadow-md)] sm:p-8',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
