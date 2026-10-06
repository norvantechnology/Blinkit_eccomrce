'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/useI18n';
import { flagUrl, type CountryCode } from '@/services/country-codes.service';

const SEARCH_THRESHOLD = 6;
const MENU_GAP = 6;

interface CountryCodePickerProps {
  countries: CountryCode[];
  value: CountryCode;
  onChange: (country: CountryCode) => void;
}

type MenuPos = { top: number; left: number; width: number };

/** Menu is portaled to <body>: the login modal clips overflow and is transformed. */
export function CountryCodePicker({ countries, value, onChange }: CountryCodePickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<MenuPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectable = countries.length > 1;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const field = rootRef.current?.parentElement;
      if (!field) return;
      const r = field.getBoundingClientRect();
      setPos({ top: r.bottom + MENU_GAP, left: r.left, width: r.width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.isoCode.toLowerCase() === q,
    );
  }, [countries, query]);

  const choose = (country: CountryCode) => {
    onChange(country);
    setOpen(false);
    setQuery('');
  };

  const menu =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            className="login-country__menu"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            onClick={(e) => e.stopPropagation()}
          >
            {countries.length > SEARCH_THRESHOLD && (
              <input
                className="login-country__search"
                placeholder={t('login.searchCountry')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            )}
            <ul className="login-country__list" role="listbox" aria-label={t('login.selectCountry')}>
              {filtered.map((c) => (
                <li key={c.isoCode}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.isoCode === value.isoCode}
                    className={cn('login-country__option', c.isoCode === value.isoCode && 'is-selected')}
                    onClick={() => choose(c)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="login-country__flag"
                      src={flagUrl(c.isoCode)}
                      alt=""
                      width={20}
                      height={15}
                      loading="lazy"
                    />
                    <span className="login-country__name">{c.name}</span>
                    <span className="login-country__dial">{c.dialCode}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="login-country__empty">{t('login.noCountry')}</li>}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="login-country" ref={rootRef}>
      <button
        type="button"
        className={cn('login-country__btn', selectable && 'is-selectable')}
        onClick={() => selectable && setOpen((v) => !v)}
        aria-haspopup={selectable ? 'listbox' : undefined}
        aria-expanded={selectable ? open : undefined}
        aria-label={`${value.name} ${value.dialCode}`}
        tabIndex={selectable ? 0 : -1}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="login-country__flag" src={flagUrl(value.isoCode)} alt="" width={20} height={15} />
        <span className="login-country__code">{value.dialCode}</span>
        {selectable && <span className={cn('login-country__chevron', open && 'is-open')} aria-hidden />}
      </button>
      {menu}
    </div>
  );
}
