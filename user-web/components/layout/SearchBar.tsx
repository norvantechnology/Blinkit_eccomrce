'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const PLACEHOLDERS = [
  'Search "milk"',
  'Search "bread"',
  'Search "eggs"',
  'Search "rice"',
  'Search "sugar"',
  'Search "chips"',
  'Search "paneer"',
  'Search "atta"',
];

/** SearchBar — Blinkit ZIGuc / fgHDQx (46px, radius 12, gap 8). */
export function SearchBar({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2000);
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
          <span key={index} className="absolute inset-x-0 top-0 truncate animate-fade-in">
            {PLACEHOLDERS[index]}
          </span>
        </span>
      </div>
    </div>
  );
}
