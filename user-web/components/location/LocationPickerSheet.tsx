'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Crosshair,
  Home,
  MapPin,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { blinkitTokens } from '@/lib/design-tokens';
import { reverseGeocode, searchPlaces, type GeoSuggestion } from '@/lib/geocode';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useUiStore } from '@/store/uiStore';
import { useCloseOnPopstate } from '@/lib/useCloseOnPopstate';
import { addressesService, type Address } from '@/services/addresses.service';

function LabelIcon({ label, compact = false }: { label: Address['label']; compact?: boolean }) {
  const box = compact ? 'h-9 w-9 rounded-lg' : 'h-10 w-10 rounded-xl';
  const icon = compact ? 'h-4 w-4' : 'h-[18px] w-[18px]';
  if (label === 'home') {
    return (
      <div className={cn('flex shrink-0 items-center justify-center bg-[#f5f5f5]', box)}>
        <Home className={cn(icon, 'text-[#E8A800]')} strokeWidth={2.25} />
      </div>
    );
  }
  if (label === 'work') {
    return (
      <div className={cn('flex shrink-0 items-center justify-center bg-[#f5f5f5]', box)}>
        <Briefcase className={cn(icon, 'text-[#8B6914]')} strokeWidth={2.25} />
      </div>
    );
  }
  return (
    <div className={cn('flex shrink-0 items-center justify-center bg-[#f5f5f5]', box)}>
      <MapPin className={cn(icon, 'text-[#E8A800]')} strokeWidth={2.25} />
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

  const dismiss = useCloseOnPopstate(open, close);

  const reloadSaved = useCallback(async () => {
    if (!user) {
      setSaved([]);
      return;
    }
    try {
      setSaved(await addressesService.list());
    } catch {
      setSaved([]);
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dismiss]);

  useEffect(() => {
    if (!open) return;
    void reloadSaved();
  }, [open, reloadSaved]);

  const applyLocation = (fullAddress: string, lat: number, lng: number, label = 'Other') => {
    setLocation({
      label,
      fullAddress,
      lat,
      lng,
      etaMinutes: blinkitTokens.defaultStore.etaMinutes,
    });
    dismiss();
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
            applyLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng, 'Current');
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

  const goAddAddress = () => {
    close();
    router.replace(user ? '/account/addresses' : '/login?redirect=/account/addresses');
  };

  const deleteAddress = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressesService.remove(id);
      await reloadSaved();
    } catch {
      setError('Could not delete address');
    }
  };

  const editAddress = (e: MouseEvent) => {
    e.stopPropagation();
    close();
    router.replace('/account/addresses');
  };

  if (!open || !mounted) return null;

  const searchInput = (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="search delivery location"
        className="h-11 w-full rounded-lg border border-[#dcdcdc] bg-white pl-9 pr-3 text-[13px] text-[#1f1f1f] outline-none placeholder:text-[#999] focus:border-[#bbb]"
        autoFocus
      />
    </div>
  );

  const suggestionList = searching ? (
    <p className="py-4 text-[13px] text-[#999]">Searching…</p>
  ) : suggestions.length > 0 ? (
    <ul className="mt-1 divide-y divide-[#f0f0f0]">
      {suggestions.map((s) => (
        <li key={s.placeId}>
          <button
            type="button"
            onClick={() => applyLocation(s.fullAddress, s.lat, s.lng)}
            className="flex w-full items-start gap-3 py-3.5 text-left hover:bg-[#fafafa]"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#999]" />
            <span className="text-[13px] leading-snug text-[#1f1f1f]">{s.fullAddress}</span>
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  /* —— Mobile: bottom sheet (unchanged pattern) —— */
  const mobileSheet = (
    <div className="flex h-full w-full flex-col justify-end sm:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 animate-fade-in"
        aria-label="Dismiss"
        onClick={dismiss}
      />
      <div className="relative z-10 flex w-full flex-col items-center">
        <button
          type="button"
          onClick={dismiss}
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f] text-white shadow-lg"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-picker-title-mobile"
          className="flex h-[min(78vh,640px)] w-full flex-col overflow-hidden rounded-t-[22px] bg-white shadow-2xl animate-sheet-up"
        >
          <div className="px-4 pb-2 pt-5">
            <h2
              id="location-picker-title-mobile"
              className="text-[20px] font-extrabold tracking-tight text-[#1f1f1f]"
            >
              Select your Location
            </h2>
            <div className="mt-4">{searchInput}</div>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={loadingGps}
              className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[#eee] bg-white px-3.5 py-3.5 text-left transition hover:bg-[#fafafa]"
            >
              <Crosshair className="h-5 w-5 shrink-0 text-[var(--cart-green)]" strokeWidth={2.25} />
              <span className="text-[14px] font-bold text-[var(--cart-green)]">
                {loadingGps ? 'Detecting location…' : 'Use current location'}
              </span>
            </button>
            {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {suggestionList}
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
                  onClick={goAddAddress}
                  className="mt-3 text-[14px] font-bold text-[var(--cart-green)]"
                >
                  + Add new address
                </button>
              </div>
            ) : null}
            {!query.trim() && (!user || saved.length === 0) ? (
              <button
                type="button"
                onClick={goAddAddress}
                className="mt-6 text-[14px] font-bold text-[var(--cart-green)]"
              >
                + Add new address
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  /* —— Desktop: Blinkit centered “Change Location” modal —— */
  const desktopModal = (
    <div className="hidden h-full w-full items-center justify-center p-6 sm:flex">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 animate-fade-in"
        aria-label="Dismiss"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-picker-title-desktop"
        className="relative z-10 flex max-h-[min(80vh,560px)] w-full max-w-[520px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-modal-in"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2
            id="location-picker-title-desktop"
            className="text-[18px] font-extrabold text-[#1f1f1f]"
          >
            Change Location
          </h2>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#666] hover:bg-[#f5f5f5]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-3 px-5">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={loadingGps}
            className="h-11 shrink-0 rounded-md bg-[var(--cart-green)] px-4 text-[13px] font-bold text-white hover:bg-[#097019] disabled:opacity-70"
          >
            {loadingGps ? 'Detecting…' : 'Detect my location'}
          </button>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ddd] text-[11px] font-semibold text-[#888]">
            OR
          </span>
          {searchInput}
        </div>

        {error ? <p className="mt-2 px-5 text-[12px] text-red-600">{error}</p> : null}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {query.trim() ? (
            suggestionList
          ) : (
            <>
              <p className="mb-3 text-[13px] font-semibold text-[#1f1f1f]">Your saved addresses</p>
              {user && saved.length > 0 ? (
                <ul className="space-y-2.5">
                  {saved.map((addr) => (
                    <li key={addr.id}>
                      <div className="rounded-lg border border-[#e8e8e8] bg-white p-3.5 transition hover:border-[#d0d0d0]">
                        <button
                          type="button"
                          onClick={() => pickSaved(addr)}
                          className="flex w-full items-start gap-3 text-left"
                        >
                          <LabelIcon label={addr.label} compact />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-bold text-[#1f1f1f]">
                              {labelTitle(addr.label)}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-[#666]">
                              {addr.fullAddress}
                            </span>
                          </span>
                        </button>
                        <div className="mt-2.5 flex items-center gap-3 pl-12">
                          <button
                            type="button"
                            onClick={editAddress}
                            className="text-[var(--cart-green)] hover:opacity-80"
                            aria-label="Edit address"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => void deleteAddress(e, addr.id)}
                            className="text-[#e53935] hover:opacity-80"
                            aria-label="Delete address"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-[13px] text-[#999]">
                  {user ? 'No saved addresses yet.' : 'Log in to see saved addresses.'}
                </p>
              )}
              <button
                type="button"
                onClick={goAddAddress}
                className="mt-4 text-[14px] font-bold text-[var(--cart-green)]"
              >
                + Add new address
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[110]">
      {mobileSheet}
      {desktopModal}
    </div>,
    document.body,
  );
}
