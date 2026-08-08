import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-sm sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:py-5',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
