import { Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({
  title,
  description = 'This section will be available in a later milestone.',
}: PlaceholderPageProps) {
  return (
    <div className="w-full">
      <PageHeader title={title} description={description} />
      <div className="flex max-w-xl items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow-sm)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]">
          <Clock className="h-4 w-4" strokeWidth={1.85} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Coming soon</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
            This module ships in an upcoming milestone.
          </p>
        </div>
      </div>
    </div>
  );
}
