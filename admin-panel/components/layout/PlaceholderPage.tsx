import { Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({
  title,
  description = 'This section will be available in a later milestone.',
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={title} description={description} />
      <Card className="flex flex-col items-center border-dashed px-4 py-10 text-center sm:py-14">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
          <Clock className="h-6 w-6 text-slate-500" strokeWidth={2} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-800">Coming soon</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          This module is planned for an upcoming milestone.
        </p>
      </Card>
    </div>
  );
}
