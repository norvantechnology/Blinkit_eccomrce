'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Home,
  MapPin,
  Maximize2,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { blinkitTokens } from '@/lib/design-tokens';
import { getApiErrorMessage } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import {
  addressesService,
  type Address,
  type AddressLabel,
  type PlaceSuggestion,
} from '@/services/addresses.service';
import { usersService } from '@/services/users.service';
import { useCloseOnPopstate } from '@/lib/useCloseOnPopstate';
import { reverseGeocode } from '@/lib/geocode';
import { searchDeliveryPlaces } from '@/lib/places-search';

export type UiAddressTag = 'home' | 'work' | 'hotel' | 'other';

const TAGS: { id: UiAddressTag; label: string; Icon: typeof Home; tone: string }[] = [
  { id: 'home', label: 'Home', Icon: Home, tone: 'text-[#E8A800]' },
  { id: 'work', label: 'Work', Icon: Briefcase, tone: 'text-[#8B6914]' },
  { id: 'hotel', label: 'Hotel', Icon: Building2, tone: 'text-[#E8A800]' },
  { id: 'other', label: 'Other', Icon: MapPin, tone: 'text-[#E8A800]' },
];

function toApiLabel(tag: UiAddressTag): AddressLabel {
  return tag === 'hotel' ? 'other' : tag;
}

function composeFullAddress(flat: string, floor: string, area: string) {
  return [flat.trim(), floor.trim() ? `Floor ${floor.trim()}` : '', area.trim()]
    .filter(Boolean)
    .join(', ');
}

function parseAddress(full: string) {
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { flat: parts[0] || '', area: '' };
  return { flat: parts[0], area: parts.slice(1).join(', ') };
}

function splitAreaCity(text: string) {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { area: 'Selected location', city: '' };
  if (parts.length === 1) return { area: parts[0], city: '' };
  return { area: parts[0], city: parts.slice(1).join(', ') };
}

type Props = {
  open: boolean;
  onClose: () => void;
  editing: Address | null;
  onSaved: (address: Address) => void;
};

export function AddressModal({ open, onClose, editing, onSaved }: Props) {
  const user = useAuthStore((s) => s.user);
  const headerLocation = useLocationStore((s) => s.location);
  const dismiss = useCloseOnPopstate(open, onClose);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  /** Mobile: map confirm first, then form sheet */
  const [step, setStep] = useState<'map' | 'form'>('map');

  const [tag, setTag] = useState<UiAddressTag>('home');
  const [flat, setFlat] = useState('');
  const [floor, setFloor] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState<number>(blinkitTokens.defaultStore.lat);
  const [lng, setLng] = useState<number>(blinkitTokens.defaultStore.lng);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searchHint, setSearchHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError('');
    setSuggestions([]);
    setSearchHint('');
    setStep('map');

    const fallbackArea =
      headerLocation?.fullAddress || blinkitTokens.defaultStore.fullAddress;
    const fallbackLat = headerLocation?.lat ?? blinkitTokens.defaultStore.lat;
    const fallbackLng = headerLocation?.lng ?? blinkitTokens.defaultStore.lng;

    if (editing) {
      const parsed = parseAddress(editing.fullAddress);
      setTag(editing.label);
      setFlat(parsed.flat);
      setFloor('');
      setArea(parsed.area || fallbackArea);
      setLandmark(editing.landmark || '');
      setLat(editing.lat ?? fallbackLat);
      setLng(editing.lng ?? fallbackLng);
      setQuery(parsed.area || editing.fullAddress);
      setStep(isMobile ? 'map' : 'form');
    } else {
      setTag('home');
      setFlat('');
      setFloor('');
      setArea(fallbackArea);
      setLandmark('');
      setLat(fallbackLat);
      setLng(fallbackLng);
      setQuery(fallbackArea);
      setStep(isMobile ? 'map' : 'form');
    }
    setName(user?.name || '');
    setPhone((user?.phone || '').replace(/^\+91/, '') || '');
  }, [open, editing, user, headerLocation, isMobile]);

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

  const delivery = useMemo(() => splitAreaCity(area || query), [area, query]);

  const mapSrc = useMemo(() => {
    const delta = 0.01;
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [lat, lng]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    setSearchHint('');
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await searchDeliveryPlaces(value.trim());
      setSuggestions(results);
      if (results.length === 0) {
        setSearchHint('No places found — enter area manually.');
      }
    } catch {
      setSuggestions([]);
      setSearchHint('Maps search unavailable — enter area manually.');
    }
  };

  const applySuggestion = (s: PlaceSuggestion) => {
    const text = s.fullAddress || s.description;
    setQuery(text);
    setArea(text);
    if (s.lat != null && s.lng != null) {
      setLat(s.lat);
      setLng(s.lng);
    }
    setSuggestions([]);
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser');
      return;
    }
    setSearchHint('Detecting location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        void (async () => {
          try {
            const address = await reverseGeocode(nextLat, nextLng);
            setQuery(address);
            setArea(address);
            setSearchHint('Moved pin to your current location');
          } catch {
            setSearchHint('Moved pin to your current location');
          }
        })();
      },
      () => {
        setSearchHint('');
        setError('Could not get current location. Allow location access or search manually.');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!flat.trim() || !area.trim() || !name.trim()) {
      setError('Please fill all required fields');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        label: toApiLabel(tag),
        fullAddress: composeFullAddress(flat, floor, area),
        lat,
        lng,
        landmark: landmark.trim() || undefined,
        isDefault: editing ? editing.isDefault : true,
      };
      const saved = editing
        ? await addressesService.update(editing.id, payload)
        : await addressesService.create(payload);

      // §19A.2 — name/phone in modal mirror Blinkit UX; persist name via profile PATCH
      const trimmedName = name.trim();
      if (trimmedName && trimmedName !== (user?.name || '')) {
        try {
          const updated = await usersService.updateMe({ name: trimmedName });
          useAuthStore.getState().setUser(updated);
        } catch {
          // Address save succeeded; profile sync is best-effort
        }
      }

      onSaved(saved);
      dismiss();
    } catch (err) {
      setError(
        getApiErrorMessage(err, editing ? 'Could not update address' : 'Could not save address'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open || !mounted) return null;

  const searchBox = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0C831F]" />
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search for area, street name…"
        className="h-11 w-full rounded-lg border border-[#e0e0e0] bg-white pl-9 pr-9 text-[13px] shadow-md outline-none focus:border-[#0C831F]"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setSuggestions([]);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#999]"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-48 overflow-auto rounded-lg border border-[#e5e5e5] bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-[#f7f7f7]"
                onClick={() => applySuggestion(s)}
              >
                <span className="font-semibold text-[#1f1f1f]">{s.mainText}</span>
                <span className="mt-0.5 block text-[11px] text-[#888]">
                  {s.secondaryText || s.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {searchHint ? (
        <p className="mt-1.5 text-[11px] text-[#666]">{searchHint}</p>
      ) : null}
    </div>
  );

  const formFields = (
    <>
      <p className="text-[13px] font-semibold text-[#888]">
        Save address as <span className="text-[#e53935]">*</span>
      </p>
      <div className="mt-2 flex gap-2">
        {TAGS.map(({ id, label, Icon, tone }) => {
          const selected = tag === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTag(id)}
              className={cn(
                'flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border text-[11px] font-semibold sm:text-[12px]',
                selected
                  ? 'border-[#0C831F] bg-[#F0F9F1] text-[#0C831F]'
                  : 'border-[#e0e0e0] bg-white text-[#555]',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', selected ? tone : 'text-[#888]')} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3.5">
        <Field label="Flat / House no / Building name" required value={flat} onChange={setFlat} />
        <Field label="Floor (optional)" value={floor} onChange={setFloor} />
        <Field
          label="Area / Sector / Locality"
          required
          value={area}
          onChange={(v) => {
            setArea(v);
            setQuery(v);
          }}
          muted
        />
        <Field label="Nearby landmark (optional)" value={landmark} onChange={setLandmark} />
      </div>

      <p className="mt-5 text-[12px] text-[#888]">
        Enter your details for seamless delivery experience
      </p>
      <div className="mt-3 space-y-3.5">
        <Field label="Your name" required value={name} onChange={setName} />
        <Field
          label="Your phone number (optional)"
          value={phone}
          onChange={setPhone}
          inputMode="tel"
        />
      </div>
      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>
      ) : null}
    </>
  );

  /* ——— MOBILE: map stays visible; form slides up over map (Blinkit) ——— */
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col bg-[#dfe7ef]">
        {/* Map layer — always mounted so form sheet shows map behind */}
        <div className="flex h-12 shrink-0 items-center border-b border-[#eee] bg-white px-2">
          <button
            type="button"
            onClick={() => (step === 'form' ? setStep('map') : dismiss())}
            className="flex h-10 w-10 items-center justify-center"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="flex-1 pr-10 text-center text-[16px] font-extrabold text-[#1f1f1f]">
            Confirm map pin location
          </h2>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#dfe7ef]">
          <iframe title="Map" src={mapSrc} className="absolute inset-0 h-full w-full border-0" />
          <div className="absolute left-3 right-3 top-3 z-20">{searchBox}</div>
          {step === 'map' ? (
            <button
              type="button"
              onClick={useGps}
              className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#0C831F] bg-white px-4 py-2 text-[12px] font-semibold text-[#0C831F] shadow-md"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Go to current location
            </button>
          ) : null}
        </div>

        {step === 'map' ? (
          <div className="shrink-0 border-t border-[#eee] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <p className="text-[15px] font-bold text-[#1f1f1f]">Delivering your order to</p>
            <div className="mt-2 flex items-start gap-3 rounded-xl bg-[#f0f4f8] px-3 py-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#318CE7]" fill="#318CE7" />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#1f1f1f]">{delivery.area}</p>
                {delivery.city ? (
                  <p className="text-[13px] text-[#666]">{delivery.city}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="mt-4 flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-[#0C831F] text-[15px] font-bold text-white"
            >
              Confirm location & proceed
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Dim map; keep it visible above the sheet */}
            <button
              type="button"
              aria-label="Back to map"
              className="absolute inset-0 z-[5] bg-black/35"
              onClick={() => setStep('map')}
            />
            <div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[min(78vh,640px)] flex-col rounded-t-2xl bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.18)] animate-sheet-up">
              <div className="flex items-center justify-between px-4 pb-1 pt-4">
                <h2 className="text-[18px] font-extrabold text-[#1f1f1f]">Enter complete address</h2>
                <button
                  type="button"
                  onClick={dismiss}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#666]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto px-4 pb-3">{formFields}</div>
                <div className="border-t border-[#f0f0f0] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-12 w-full rounded-xl bg-[#0C831F] text-[15px] font-bold text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>,
      document.body,
    );
  }

  /* ——— DESKTOP / laptop: two-column modal ——— */
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 bg-black/50"
        onClick={dismiss}
      />
      <div className="relative z-10 flex h-[min(90vh,720px)] w-full max-w-[min(980px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.28)] xl:h-[min(85vh,640px)] xl:flex-row">
        <div className="flex h-[38%] min-h-[220px] shrink-0 flex-col border-b border-[#eee] xl:h-full xl:min-h-0 xl:w-[46%] xl:shrink-0 xl:border-b-0 xl:border-r">
          <div className="relative min-h-0 flex-1 bg-[#dfe7ef]">
            <iframe title="Map" src={mapSrc} className="absolute inset-0 h-full w-full border-0" />
            <div className="absolute left-3 right-3 top-3 z-20">{searchBox}</div>
            <button
              type="button"
              onClick={useGps}
              className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-[12px] font-semibold text-[#0C831F] shadow-md"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Go to current location
            </button>
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#555] shadow-md"
              aria-label="Open full map"
            >
              <Maximize2 className="h-4 w-4" />
            </a>
          </div>
          <div className="border-t border-[#eee] bg-[#f7f7f7] px-4 py-3">
            <p className="text-[12px] text-[#888]">Delivering your order to</p>
            <div className="mt-1.5 flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#318CE7]" fill="#318CE7" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-[#1f1f1f]">{delivery.area}</p>
                {delivery.city ? (
                  <p className="truncate text-[12px] text-[#666]">{delivery.city}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden xl:min-w-0 xl:flex-1">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h2 className="text-[18px] font-extrabold text-[#1f1f1f]">Enter complete address</h2>
            <button
              type="button"
              onClick={dismiss}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#666] hover:bg-[#f5f5f5]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">{formFields}</div>
          <div className="border-t border-[#f0f0f0] px-5 py-3">
            <button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-lg bg-[#0C831F] text-[15px] font-bold text-white hover:bg-[#097019] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  inputMode,
  muted,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: 'tel' | 'text' | 'numeric';
  muted?: boolean;
}) {
  const filled = value.length > 0;
  return (
    <label className="relative block">
      <span
        className={cn(
          'pointer-events-none absolute left-3 z-[1] px-1 text-[#888] transition-all',
          muted ? 'bg-[#f5f5f5]' : 'bg-white',
          filled ? 'top-0 -translate-y-1/2 text-[11px]' : 'top-1/2 -translate-y-1/2 text-[13px]',
        )}
      >
        {label}
        {required ? <span className="text-[#e53935]"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={inputMode}
        className={cn(
          'h-12 w-full rounded-lg border border-[#d0d0d0] px-3 pt-1 text-[14px] text-[#1f1f1f] outline-none focus:border-[#0C831F]',
          muted && 'bg-[#f5f5f5]',
        )}
      />
    </label>
  );
}
