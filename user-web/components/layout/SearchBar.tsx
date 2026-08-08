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

export function SearchBar({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={cn('flex min-w-0 flex-1 items-center', className)}>
      <div
        className={cn(
          'flex h-[46px] w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 lg:rounded-xl',
          'border-[rgba(0,0,0,0.08)] bg-[#f8f8f8] text-[#828282]',
        )}
        role="search"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
          <circle cx="11" cy="11" r="7" stroke="#1f1f1f" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="relative h-[18px] min-w-0 flex-1 overflow-hidden text-left text-sm">
          <span key={index} className="absolute inset-x-0 top-0 truncate animate-fade-in font-medium text-[#999]">
            {PLACEHOLDERS[index]}
          </span>
        </span>
      </div>
    </div>
  );
}
