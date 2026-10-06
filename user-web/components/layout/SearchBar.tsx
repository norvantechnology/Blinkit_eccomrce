'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/useI18n';
import type { MessageKey } from '@/lib/i18n/messages';

const PLACEHOLDER_KEYS: MessageKey[] = [
  'search.p0',
  'search.p1',
  'search.p2',
  'search.p3',
  'search.p4',
  'search.p5',
  'search.p6',
  'search.p7',
];

/** SearchBar - Blinkit ZIGuc / fgHDQx (46px, radius 12, gap 8). */
export function SearchBar({ className }: { className?: string }) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const index = tick % PLACEHOLDER_KEYS.length;
  const prevIndex = (tick - 1 + PLACEHOLDER_KEYS.length) % PLACEHOLDER_KEYS.length;

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={cn('bk-search', className)}>
      <div className="bk-search__btn" role="search">
        <span className="bk-search__icon">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/blinkit-parity/icons/search-muted.svg" alt="" width={20} height={20} aria-hidden />
        </span>
        <span className="bk-search__placeholder">
          {tick > 0 && (
            <span key={`out-${tick}`} className="bk-search__hint bk-search__hint--out" aria-hidden>
              {t(PLACEHOLDER_KEYS[prevIndex])}
            </span>
          )}
          <span
            key={`in-${tick}`}
            className={cn('bk-search__hint', tick > 0 && 'bk-search__hint--in')}
          >
            {t(PLACEHOLDER_KEYS[index])}
          </span>
        </span>
      </div>
    </div>
  );
}
