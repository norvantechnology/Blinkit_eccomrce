'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { getApiErrorMessage } from '@/lib/auth';
import { useCloseOnPopstate } from '@/lib/useCloseOnPopstate';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import {
  addressesService,
  type Address,
  type AddressLabel,
  type PlaceSuggestion,
} from '@/services/addresses.service';
import { usersService } from '@/services/users.service';
import { reverseGeocode } from '@/lib/geocode';
import { searchDeliveryPlaces } from '@/lib/places-search';
import '@/styles/blinkit-address-form-modal.css';
import '@/styles/blinkit-iconfont.css';
import '@/styles/blinkit-location-popup.css';

export type UiAddressTag = 'home' | 'work' | 'hotel' | 'other';

const TAG_ICONS: Record<UiAddressTag, string> = {
  home: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=45/layout-engine/v2/2024-12/address_home_location_v4/light.png',
  work: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=45/layout-engine/v2/2024-12/address_work_location_v4/light.png',
  hotel:
    'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=45/layout-engine/v2/2024-12/address_hotel_location_v4/light.png',
  other:
    'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=45/layout-engine/v2/2024-12/address_other_location_v4/light.png',
};

const TAGS: { id: UiAddressTag; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'other', label: 'Other' },
];

const LOCATION_PIN =
  'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=225/layout-engine/2024-01/image.png';

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

/** Stop refining once the fix is this precise (metres) or after GPS_WATCH_MS. */
const GPS_GOOD_ACCURACY_M = 50;
const GPS_WATCH_MS = 12000;
const GPS_APPROX_ACCURACY_M = 1000;

function geoErrorMessage(err: GeolocationPositionError) {
  if (err.code === err.PERMISSION_DENIED) {
    return 'Location access is blocked. Allow location for this site in your browser settings, then try again.';
  }
  if (err.code === err.TIMEOUT) {
    return 'Getting your location took too long. Try again or search your address.';
  }
  return 'Could not get your current location. Turn on device location or search your address.';
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

function FloatingField({
  id,
  name,
  label,
  value,
  onChange,
  required,
  disabled,
  inputMode,
  type = 'text',
  multiline,
  className,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  type?: string;
  multiline?: boolean;
  className?: string;
}) {
  const clear = () => onChange('');
  return (
    <div
      className={`TextInput__StyledTextInput-sc-abdg41-0 cNThDN${className ? ` ${className}` : ''}`}
    >
      {multiline ? (
        <textarea
          rows={1}
          data-min-rows={1}
          autoComplete="off"
          name={name}
          id={id}
          required={required}
          disabled={disabled}
          placeholder=" "
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          autoComplete="off"
          type={type}
          inputMode={inputMode}
          name={name}
          id={id}
          required={required}
          disabled={disabled}
          placeholder=" "
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <label htmlFor={id} className="TextInput__Label-sc-abdg41-1 ioloWN">
        {label}
      </label>
      {!disabled ? (
        <button
          type="button"
          id="input-cross"
          className={`TextInput__CrossIconWrapper-sc-abdg41-2 edUfUb${value ? ' is-visible' : ''}`}
          aria-label="Clear"
          onClick={clear}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
            <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export function AddressModal({ open, onClose, editing, onSaved }: Props) {
  const user = useAuthStore((s) => s.user);
  const headerLocation = useLocationStore((s) => s.location);
  /** Browser back closes the modal; query params are stripped on open so it won't reopen. */
  const { dismiss } = useCloseOnPopstate(open, onClose);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState<'map' | 'form'>('map');

  const [tag, setTag] = useState<UiAddressTag>('home');
  const [flat, setFlat] = useState('');
  const [floor, setFloor] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsNote, setGpsNote] = useState('');
  const [gpsError, setGpsError] = useState('');
  const gpsWatchRef = useRef<{ id: number | null; timer: number | null; abort: AbortController | null }>({
    id: null,
    timer: null,
    abort: null,
  });

  const stopGps = useCallback(() => {
    const w = gpsWatchRef.current;
    if (w.id != null) navigator.geolocation?.clearWatch(w.id);
    if (w.timer != null) window.clearTimeout(w.timer);
    w.abort?.abort();
    gpsWatchRef.current = { id: null, timer: null, abort: null };
    setLocating(false);
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    return stopGps;
  }, [open, stopGps]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1020px)');
    const apply = () => setIsMobile(mq.matches);
    const onChange = () => {
      apply();
      setStep(mq.matches ? 'map' : 'form');
    };
    apply();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /** Reset only when the modal opens or switches address - user/header refreshes must not move a GPS/search pin. */
  useEffect(() => {
    if (!open) return;
    setError('');
    setGpsError('');
    setGpsNote('');
    setSuggestions([]);
    setStep('map');

    const fallbackArea = headerLocation?.fullAddress || '';
    const fallbackLat = headerLocation?.lat ?? null;
    const fallbackLng = headerLocation?.lng ?? null;

    if (editing) {
      const parsed = parseAddress(editing.fullAddress);
      setTag(editing.label === 'home' || editing.label === 'work' ? editing.label : 'other');
      setFlat(parsed.flat);
      setFloor('');
      setArea(parsed.area || fallbackArea);
      setLandmark(editing.landmark || '');
      setLat(editing.lat ?? fallbackLat);
      setLng(editing.lng ?? fallbackLng);
      setQuery(editing.fullAddress || parsed.area || fallbackArea);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [open, editing]);

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
    if (lat == null || lng == null) return '';
    const delta = 0.008;
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    // No OSM marker - Blinkit uses fixed .center-marker over the map
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  }, [lat, lng]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await searchDeliveryPlaces(value.trim());
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  };

  const applySuggestion = (s: PlaceSuggestion) => {
    stopGps();
    setGpsNote('');
    setGpsError('');
    const text = s.fullAddress || s.description;
    setQuery(text);
    setArea(text);
    if (s.lat != null && s.lng != null) {
      setLat(s.lat);
      setLng(s.lng);
    }
    setSuggestions([]);
    setSearchFocused(false);
  };

  /**
   * Watch GPS for a few seconds and keep the most accurate fix - laptops often return a rough
   * Wi-Fi/IP fix first. Pin moves on the first fix and again whenever a better one arrives.
   */
  const locateMe = () => {
    if (locating) return;
    setGpsError('');
    setGpsNote('');
    if (!navigator.geolocation) {
      setGpsError('Location is not supported in this browser. Search your address instead.');
      return;
    }
    stopGps();
    setLocating(true);

    let best: GeolocationCoordinates | null = null;

    const applyFix = (coords: GeolocationCoordinates) => {
      const nextLat = coords.latitude;
      const nextLng = coords.longitude;
      setLat(nextLat);
      setLng(nextLng);
      gpsWatchRef.current.abort?.abort();
      const controller = new AbortController();
      gpsWatchRef.current.abort = controller;
      void (async () => {
        let address = `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`;
        try {
          address = await reverseGeocode(nextLat, nextLng, controller.signal);
        } catch {
          if (controller.signal.aborted) return;
        }
        if (controller.signal.aborted) return;
        setQuery(address);
        setArea(address);
      })();
    };

    const finish = () => {
      const w = gpsWatchRef.current;
      if (w.id != null) navigator.geolocation.clearWatch(w.id);
      if (w.timer != null) window.clearTimeout(w.timer);
      gpsWatchRef.current = { ...w, id: null, timer: null };
      setLocating(false);
      if (best && best.accuracy > GPS_APPROX_ACCURACY_M) {
        const km = Math.round(best.accuracy / 100) / 10;
        setGpsNote(
          `Your browser could only find an approximate location (about ${km} km). Search your exact address for an accurate pin.`,
        );
      }
    };

    const onFix = (pos: GeolocationPosition) => {
      if (best && pos.coords.accuracy >= best.accuracy) return;
      best = pos.coords;
      applyFix(pos.coords);
      if (pos.coords.accuracy <= GPS_GOOD_ACCURACY_M) finish();
    };

    const fallbackLowAccuracy = (firstErr: GeolocationPositionError) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onFix(pos);
          finish();
        },
        () => {
          finish();
          setGpsError(geoErrorMessage(firstErr));
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
      );
    };

    const id = navigator.geolocation.watchPosition(
      onFix,
      (err) => {
        if (best) return;
        const w = gpsWatchRef.current;
        if (w.id != null) navigator.geolocation.clearWatch(w.id);
        if (w.timer != null) window.clearTimeout(w.timer);
        gpsWatchRef.current = { ...w, id: null, timer: null };
        if (err.code === err.PERMISSION_DENIED) {
          setLocating(false);
          setGpsError(geoErrorMessage(err));
          return;
        }
        fallbackLowAccuracy(err);
      },
      { enableHighAccuracy: true, timeout: GPS_WATCH_MS, maximumAge: 0 },
    );
    gpsWatchRef.current.id = id;
    gpsWatchRef.current.timer = window.setTimeout(() => {
      if (best) finish();
    }, GPS_WATCH_MS);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!flat.trim() || !area.trim() || !name.trim()) {
      setError('Please fill all required fields');
      return;
    }
    if (lat == null || lng == null) {
      setError('Please search or detect a location on the map');
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

      const trimmedName = name.trim();
      if (trimmedName && trimmedName !== (user?.name || '')) {
        try {
          const updated = await usersService.updateMe({ name: trimmedName });
          useAuthStore.getState().setUser(updated);
        } catch {
          /* best-effort */
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

  const showValueLabel = Boolean(query) && !searchFocused;

  const locationSelect = (
    <div className="styles__LocationSelectorWrapper-sc-cc1wzf-14 dkBIpa">
      <div
        className={`Select styles__LocationSelect-sc-cc1wzf-15 jRqnbc is-clearable is-searchable Select--single${
          query ? ' has-value' : ''
        }`}
      >
        <span className="bk-addr-search-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#318616" strokeWidth="2.2" />
            <path d="M16.5 16.5L21 21" stroke="#318616" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
        <div className="Select-control">
          <div className="Select-multi-value-wrapper" id="react-select-address--value">
            {showValueLabel ? (
              <div className="Select-value">
                <span className="Select-value-label" role="option" aria-selected="true">
                  {query}
                </span>
              </div>
            ) : null}
            <div className="Select-input">
              <input
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-autocomplete="list"
                value={searchFocused || !query ? query : ''}
                placeholder={query ? '' : 'Search delivery location'}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => setSearchFocused(false), 150);
                }}
              />
            </div>
          </div>
          {query ? (
            <span
              aria-label="Clear value"
              className="Select-clear-zone"
              title="Clear value"
              role="button"
              tabIndex={0}
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setQuery('');
                  setSuggestions([]);
                }
              }}
            >
              <span className="Select-clear">×</span>
            </span>
          ) : null}
          <span className="Select-arrow-zone">
            <span className="Select-arrow" />
          </span>
        </div>
        {suggestions.length > 0 ? (
          <div className="bk-addr-suggestions" role="listbox">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applySuggestion(s)}
              >
                <div className="bk-addr-suggestions__main">{s.mainText}</div>
                <div className="bk-addr-suggestions__sub">
                  {s.secondaryText || s.description}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );

  const mapBlock = (
    <div className="styles__MapContainer-sc-cc1wzf-13 jxdAuJ">
      <div className="map-container">
        {mapSrc ? (
          <iframe title="Map" src={mapSrc} />
        ) : (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              minHeight: 220,
              background: '#f4f6f8',
              color: '#666',
              fontSize: 13,
              padding: 16,
              textAlign: 'center',
            }}
          >
            Search or detect your location to place the pin
          </div>
        )}
        <div>
          <div>
            <div className="center-marker" />
          </div>
        </div>
      </div>
    </div>
  );

  const locationInfo = (
    <div className="styles__LocationInfoWrapper-sc-cc1wzf-17 iQirAt">
      <div
        className={`styles__DetectLocationButton-sc-cc1wzf-16 hEmjqm${locating ? ' is-locating' : ''}`}
        role="button"
        tabIndex={0}
        aria-busy={locating}
        aria-disabled={locating}
        onClick={locateMe}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            locateMe();
          }
        }}
      >
        <span className="bk-addr-gps-icon" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blinkit-parity/icons/location/current-location.svg"
            alt=""
            width={14}
            height={14}
          />
        </span>
        {locating ? 'Locating…' : 'Go to current location'}
      </div>
      {gpsError || gpsNote ? (
        <div className={`bk-addr-gps-msg${gpsError ? ' is-error' : ''}`} role="status" aria-live="polite">
          {gpsError || gpsNote}
        </div>
      ) : null}
      <div className="styles__LocationInfoHeader-sc-cc1wzf-18 eboNFh">
        Delivering your order to{' '}
      </div>
      <div className="styles__LocationInfo-sc-cc1wzf-19 eIqGle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={44} height={44} src={LOCATION_PIN} alt="" />
        <div className="styles__LocationInfoText-sc-cc1wzf-11 cmbRXV">
          <div className="styles__LocationInfoHeading-sc-cc1wzf-8 InEAC">{delivery.area}</div>
          {delivery.city ? (
            <div className="styles__LocationInfoSubheading-sc-cc1wzf-10 bkMpuG">
              {delivery.city}
            </div>
          ) : null}
        </div>
      </div>
      {isMobile ? (
        <button
          type="button"
          className="StickyFooterComponent__SaveAddressButton-sc-13bkdgz-1 jBTrwA bk-addr-pin-proceed"
          onClick={() => setStep('form')}
        >
          Update the pin & proceed
          <span className="bk-addr-pin-proceed__chev" aria-hidden>
            ▸
          </span>
        </button>
      ) : null}
    </div>
  );

  const formBody = (
    <>
      <div className="AddressForm__AddressFormWrapper-sc-12jjkjl-5 tJywa">
        <div>
          <div className="AddressForm__LocationTagsWrapper-sc-12jjkjl-0 kfCACP">
            <div className="AddressForm__FieldLabel-sc-12jjkjl-1 bXIuQM">Save address as *</div>
            <div className="AddressForm__LocationPillWrapper-sc-12jjkjl-2 yIGGC">
              {TAGS.map(({ id, label }) => (
                <div key={id} className="AddressForm__LocationTagWrapper-sc-12jjkjl-3 bZbNBH">
                  <div
                    className={`AddressForm__LocationTag-sc-12jjkjl-4 ${
                      tag === id ? 'gtySpN is-selected' : 'celWih'
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setTag(id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setTag(id);
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={TAG_ICONS[id]} width={18} height={18} alt="" />
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <FloatingField
            id="address"
            name="address"
            label="Flat / House no / Building name *"
            value={flat}
            onChange={setFlat}
            required
          />
        </div>
        <div>
          <FloatingField id="floor" name="floor" label="Floor (optional)" value={floor} onChange={setFloor} />
        </div>
        <div>
          <FloatingField
            id="heuristics"
            name="heuristics"
            label="Area / Sector / Locality *"
            value={area.replace(/\s*\n\s*/g, ', ')}
            onChange={(v) => {
              setArea(v);
              setQuery(v);
            }}
            required
            disabled
            className="bk-addr-area-field"
          />
        </div>
        <div>
          <FloatingField
            id="landmark"
            name="landmark"
            label="Nearby landmark (optional)"
            value={landmark}
            onChange={setLandmark}
          />
        </div>
        <div>
          <div className="AddressForm___StyledDiv2-sc-12jjkjl-7 fmJKI">
            <div
              className="tw-text-200 tw-font-medium"
              data-pf="reset"
              style={{
                color: 'var(--colors-grey-500, #828282)',
                background: 'var(--colors-undefined-100, transparent)',
              }}
            >
              Enter your details for seamless delivery experience
            </div>
          </div>
        </div>
        <div>
          <FloatingField
            id="name"
            name="name"
            label="Your name *"
            value={name}
            onChange={setName}
            required
          />
        </div>
        <div>
          <FloatingField
            id="phone"
            name="phone"
            label="Your phone number (optional)"
            value={phone}
            onChange={setPhone}
            type="number"
            inputMode="numeric"
          />
        </div>
        {error ? <div className="bk-addr-form-error">{error}</div> : null}
      </div>

      <div className="StickyFooterComponent__StickyFooter-sc-13bkdgz-0 gzMuRY">
        <div style={{ margin: '16px 12px 24px' }}>
          <button
            type="button"
            className="StickyFooterComponent__SaveAddressButton-sc-13bkdgz-1 jBTrwA"
            disabled={saving}
            onClick={() => void handleSubmit()}
          >
            {saving ? 'Saving…' : 'Save Address'}
          </button>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return createPortal(
      <div className="bk-addr-mobile-root" role="dialog" aria-modal="true">
        <button
          type="button"
          className="bk-addr-mobile-dim bk-dim-overlay"
          style={{ backgroundColor: 'rgba(50, 50, 50, 0.7)' }}
          aria-label="Dismiss"
          onClick={() => (step === 'form' ? setStep('map') : dismiss())}
        />
        <div className={`bk-addr-mobile-card${step === 'form' ? ' bk-addr-mobile-card--form' : ''}`}>
          <div className="bk-addr-mobile-map">
            <div className="bk-addr-mobile-header">
              <button
                type="button"
                className="bk-addr-mobile-back"
                onClick={() => (step === 'form' ? setStep('map') : dismiss())}
                aria-label="Back"
              >
                <svg width="7" height="11" viewBox="0 0 7 11" fill="none" aria-hidden="true">
                  <path
                    d="M5.75 1L1.25 5.5 5.75 10"
                    stroke="#1c1c1c"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="bk-addr-mobile-header__title">Confirm map pin location</div>
            </div>
            {locationSelect}
            {mapBlock}
            {step === 'map' ? locationInfo : null}
            {step === 'form' ? (
              <button
                type="button"
                className="bk-addr-mobile-map-dim"
                aria-label="Close address form"
                onClick={() => setStep('map')}
              />
            ) : null}
          </div>
          {step === 'form' ? (
            <div className="bk-addr-mobile-sheet">
              <div className="AddressFormModal__ModalHeader-sc-i6hou3-1 gSXqqS">
                <span>Enter complete address</span>
                <button type="button" className="bk-addr-close" aria-label="Close" onClick={dismiss}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M1 1l12 12M13 1L1 13"
                      stroke="#696969"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="bk-addr-mobile-sheet__body">{formBody}</div>
            </div>
          ) : null}
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      className="ReactModal__Overlay ReactModal__Overlay--after-open bk-addr-overlay bk-dim-overlay"
      style={{ backgroundColor: 'rgba(50, 50, 50, 0.7)' }}
      role="presentation"
      onClick={dismiss}
    >
      <div
        className="ReactModal__Content ReactModal__Content--after-open styles__ModalContainer-sc-cc1wzf-0 kDsHLL"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="styles__MapSection-sc-cc1wzf-12 fTrOuF">
          {locationSelect}
          {mapBlock}
          {locationInfo}
        </div>
        <div className="styles__FormSection-sc-cc1wzf-20 TQTwd">
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="AddressFormModal__ModalHeader-sc-i6hou3-1 gSXqqS">
              <span>Enter complete address</span>
              <button type="button" className="bk-addr-close" aria-label="Close" onClick={dismiss}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="#696969"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            {formBody}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
