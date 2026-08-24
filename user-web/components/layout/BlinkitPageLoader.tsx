import { cn } from '@/lib/utils';

/** Blinkit Feed loader — green arc spinner (components__Spin + Feed__LoaderContainer). */
export function BlinkitPageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn('Feed__LoaderContainer-sc-1yhjzxr-0 lgnjla bk-feed-loader', className)}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="components__Spin-sc-1drf5am-1 dEibCm bk-spin" aria-hidden />
    </div>
  );
}
