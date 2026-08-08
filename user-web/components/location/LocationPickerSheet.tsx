'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Briefcase, Crosshair, Home, MapPin, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { blinkitTokens } from '@/lib/design-tokens';
import { reverseGeocode, searchPlaces, type GeoSuggestion } from '@/lib/geocode';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useUiStore } from '@/store/uiStore';
import { addressesService, type Address } from '@/services/addresses.service';

function LabelIcon({ label }: { label: Address['label'] }) {
  if (label === 'home') {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5]">
        <Home className="h-[18px] w-[18px] text-[#E8A800]" strokeWidth={2.25} />
      </div>
    );
  }
  if (label === 'work') {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5]">
        <Briefcase className="h-[18px] w-[18px] text-[#8B6914]" strokeWidth={2.25} />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5]">
      <MapPin className="h-[18px] w-[18px] text-[#E8A800]" strokeWidth={2.25} />
    </div>
  );
}

function labelTitle(label: Address['label']) {
  if (label === 'home') return 'Home';
  if (label === 'work') return 'Work';
  return 'Other';
}

export function LocationPickerSheet() {
  const router = useRouter();
  const open = useUiStore((s) => s.locationPickerOpen);
  const setOpen = useUiStore((s) => s.setLocationPickerOpen);
  const user = useAuthStore((s) => s.user);
  const setLocation = useLocationStore((s) => s.setLocation);

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [saved, setSaved] = useState<Address[]>([]);
  const [loadingGps, setLoadingGps] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSuggestions([]);
    setError('');
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !user) {
      setSaved([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const list = await addressesService.list();
        if (!cancelled) setSaved(list);
      } catch {
        if (!cancelled) setSaved([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const applyLocation = (fullAddress: string, lat: number, lng: number, label = 'Other') => {
    setLocation({
      label,
      fullAddress,
      lat,
      lng,
      etaMinutes: blinkitTokens.defaultStore.etaMinutes,
    });
    close();
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setError('');
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          let results: GeoSuggestion[] = [];
          if (user) {
            try {
              const api = await addressesService.search(value.trim());
              results = api
                .filter((s) => s.lat != null && s.lng != null)
                .map((s) => ({
                  placeId: s.placeId,
                  description: s.description || s.fullAddress,
                  fullAddress: s.fullAddress || s.description,
                  lat: s.lat as number,
                  lng: s.lng as number,
                }));
            } catch {
              /* fall through to OSM */
            }
          }
          if (results.length === 0) results = await searchPlaces(value.trim());
          setSuggestions(results);
        } catch {
          setSuggestions([]);
          setError('Could not search locations. Try again.');
        } finally {
          setSearching(false);
        }
      })();
    }, 320);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser');
      return;
    }
    setLoadingGps(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        void (async () => {
          try {
            const address = await reverseGeocode(lat, lng);
            applyLocation(address, lat, lng, 'Current');
          } catch {
            applyLocation(
              `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              lat,
              lng,
              'Current',
            );
          } finally {
            setLoadingGps(false);
          }
        })();
      },
      () => {
        setLoadingGps(false);
        setError('Could not get current location. Allow access or search manually.');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const pickSaved = (addr: Address) => {
    applyLocation(
      addr.fullAddress,
      addr.lat ?? blinkitTokens.defaultStore.lat,
      addr.lng ?? blinkitTokens.defaultStore.lng,
      labelTitle(addr.label),
    );
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 animate-fade-in"
        aria-label="Dismiss"
        onClick={close}
      />

      <div className="relative z-10 flex w-full flex-col items-center px-0 sm:px-4 sm:pb-4">
        {/* Floating black close — Blinkit */}
        <button
          type="button"
          onClick={close}
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f] text-white shadow-lg transition hover:bg-black"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-picker-title"
          className={cn(
            'flex w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl',
            'rounded-t-[22px] sm:rounded-[22px]',
            'h-[min(78vh,640px)] animate-sheet-up',
          )}
        >
          <div className="px-4 pb-2 pt-5 sm:px-5">
            <h2
              id="location-picker-title"
              className="text-[20px] font-extrabold tracking-tight text-[#1f1f1f]"
            >
              Select your Location
            </h2>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
              <input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="search delivery location"
                className="h-12 w-full rounded-xl border border-[#e0e0e0] bg-white pl-10 pr-3 text-[14px] text-[#1f1f1f] outline-none placeholder:text-[#999] focus:border-[#c8c8c8]"
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={loadingGps}
              className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[#eee] bg-white px-3.5 py-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-[#fafafa] active:scale-[0.99]"
            >
              <Crosshair
                className="h-5 w-5 shrink-0 text-[var(--cart-green)]"
                strokeWidth={2.25}
              />
              <span className="text-[14px] font-bold text-[var(--cart-green)]">
                {loadingGps ? 'Detecting location…' : 'Use current location'}
              </span>
            </button>

            {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-5">
            {searching ? (
              <p className="py-4 text-[13px] text-[#999]">Searching…</p>
            ) : null}

            {suggestions.length > 0 ? (
              <ul className="mt-1 divide-y divide-[#f0f0f0]">
                {suggestions.map((s) => (
                  <li key={s.placeId}>
                    <button
                      type="button"
                      onClick={() => applyLocation(s.fullAddress, s.lat, s.lng)}
                      className="flex w-full items-start gap-3 py-3.5 text-left hover:bg-[#fafafa]"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#999]" />
                      <span className="text-[13px] leading-snug text-[#1f1f1f]">
                        {s.fullAddress}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {!query.trim() && user && saved.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#999]">
                  Saved addresses
                </p>
                <ul className="space-y-1">
                  {saved.map((addr) => (
                    <li key={addr.id}>
                      <button
                        type="button"
                        onClick={() => pickSaved(addr)}
                        className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left hover:bg-[#fafafa]"
                      >
                        <LabelIcon label={addr.label} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold text-[#1f1f1f]">
                            {labelTitle(addr.label)}
                            {addr.isDefault ? (
                              <span className="ml-2 text-[11px] font-semibold text-[var(--cart-green)]">
                                Default
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block truncate text-[13px] text-[#666]">
                            {addr.fullAddress}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    router.push('/account/addresses');
                  }}
                  className="mt-3 text-[14px] font-bold text-[var(--cart-green)]"
                >
                  + Add new address
                </button>
              </div>
            ) : null}

            {!query.trim() && user && saved.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  close();
                  router.push('/account/addresses');
                }}
                className="mt-6 text-[14px] font-bold text-[var(--cart-green)]"
              >
                + Add new address
              </button>
            ) : null}

            {!query.trim() && !user ? (
              <p className="mt-8 text-center text-[13px] text-[#999]">
                Search or use current location to set delivery area.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
