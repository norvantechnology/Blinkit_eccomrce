'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { blinkitTokens } from '@/lib/design-tokens';
import { reverseGeocode, type GeoSuggestion } from '@/lib/geocode';
import { searchDeliveryPlaces } from '@/lib/places-search';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useUiStore } from '@/store/uiStore';
import { useCloseOnPopstate } from '@/lib/useCloseOnPopstate';
import { addressesService, type Address } from '@/services/addresses.service';
import '@/styles/blinkit-location-popup.css';
import '@/styles/blinkit-iconfont.css';

const ICON = {
  home: 'https://cdn.grofers.com/layout-engine/v2/2025-02/address_home_icon_v5/address_home_icon_v5_light.png',
  work: 'https://cdn.grofers.com/layout-engine/v2/2025-02/address_work_icon_v5/address_work_icon_v5_light.png',
  other:
    'https://cdn.grofers.com/layout-engine/v2/2025-02/address_home_icon_v5/address_home_icon_v5_light.png',
} as const;

function labelTitle(label: Address['label']) {
  if (label === 'home') return 'Home';
  if (label === 'work') return 'Work';
  return 'Other';
}

function iconSrc(label: Address['label']) {
  if (label === 'home') return ICON.home;
  if (label === 'work') return ICON.work;
  return ICON.other;
}

/** Blinkit Change Location popup — same DOM/CSS as live desktop HTML. */
export function LocationPickerSheet() {
  const router = useRouter();
  const open = useUiStore((s) => s.locationPickerOpen);
  const locationAnchor = useUiStore((s) => s.locationAnchor);
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
          const api = await searchDeliveryPlaces(value.trim());
          setSuggestions(
            api.map((s) => ({
              placeId: s.placeId,
              description: s.description || s.fullAddress,
              fullAddress: s.fullAddress || s.description,
              lat: s.lat as number,
              lng: s.lng as number,
            })),
          );
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
    if (!user) {
      close();
      router.replace('/login?redirect=/account/addresses?add=1');
      return;
    }
    // Keep Change Location open behind (Blinkit); open form on account page
    router.push('/account/addresses?add=1');
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

  /** Edit → account addresses + Enter complete address modal (location popup stays behind). */
  const editAddress = (e: MouseEvent, addr: Address) => {
    e.stopPropagation();
    if (!user) {
      close();
      router.replace(`/login?redirect=/account/addresses?edit=${encodeURIComponent(addr.id)}`);
      return;
    }
    router.push(`/account/addresses?edit=${encodeURIComponent(addr.id)}`);
  };

  if (!open || !mounted) return null;

  const PANEL_W = 500;

  const resolveAnchor = () => {
    if (locationAnchor) return locationAnchor;
    const el = document.getElementById('header-location-trigger');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: r.top,
      left: r.left,
      bottom: r.bottom,
      width: r.width,
      right: r.right,
    };
  };

  /**
   * Blinkit: center the 500px popup under the “Delivery in …” location block
   * so that header text sits in the middle of the panel (not left-aligned).
   */
  const desktopLeft = (() => {
    if (typeof window === 'undefined') return 16;
    const anchor = resolveAnchor();
    const width = anchor?.width ?? 320;
    const leftEdge = anchor?.left ?? 16;
    const centerX = leftEdge + width / 2;
    const left = centerX - PANEL_W / 2;
    const maxLeft = Math.max(8, window.innerWidth - PANEL_W - 8);
    return Math.min(Math.max(8, left), maxLeft);
  })();

  const desktopTop = (() => {
    const anchor = resolveAnchor();
    // Small gap under header location row (Blinkit ~0–4px under header edge)
    return (anchor?.bottom ?? 86) + 0;
  })();

  const searchRow = (
    <div style={{ display: 'flex', height: '100%' }}>
      <button
        type="button"
        className="btn location-box mask-button"
        style={{ width: 130, justifyContent: 'center', alignItems: 'center', padding: 0 }}
        onClick={useCurrentLocation}
        disabled={loadingGps}
      >
        {loadingGps ? 'Detecting…' : 'Detect my location'}
      </button>
      <div className="oval-container">
        <div className="oval">
          <span className="separator-text">
            <div className="or">OR</div>
          </span>
        </div>
      </div>
      <div style={{ width: 220, flex: 1, minWidth: 0 }}>
        <div className="modal-right__input-wrapper">
          <div className="display--table full-width">
            <div className="display--table-cell full-width">
              <div id="map-canvas" />
              <input
                type="text"
                name="select-locality"
                placeholder="search delivery location"
                autoComplete="off"
                className="LocationSearchBox__InputSelect-sc-1k8u6a6-0 fZCGlI location-search-input-v1-native"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const savedList =
    user && saved.length > 0 ? (
      <div className="address-container-v1">
        {saved.map((addr) => (
          <div
            key={addr.id}
            className="AddressListItem__AddressItemWrapperItem-sc-wi2msz-0 gdmljZ"
          >
            <div
              className="AddressListItem__AddressItemWrapper-sc-wi2msz-1 OLFGk"
              role="button"
              tabIndex={0}
              onClick={() => pickSaved(addr)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  pickSaved(addr);
                }
              }}
            >
              <div className="AddressListItem__AddressIcon-sc-wi2msz-2 hGpNML">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  title={labelTitle(addr.label).toUpperCase()}
                  src={iconSrc(addr.label)}
                  className="AddressListItem__IconImage-sc-wi2msz-6 fyxEWH"
                  alt={labelTitle(addr.label)}
                />
              </div>
              <div className="AddressListItem__AddressDetails-sc-wi2msz-3 hppBoz">
                <div className="AddressListItem__AddressLabel-sc-wi2msz-4 kmfNid">
                  {labelTitle(addr.label)}
                </div>
                <div className="AddressListItem__AddressDetails-sc-wi2msz-3 hppBoz">
                  {addr.fullAddress}
                </div>
                <div className="AddressListItem__AddressEditIcon-sc-wi2msz-5 fcWpCe">
                  <div
                    className="AddressListItem__EditIcon-sc-wi2msz-7 eiUMmD"
                    role="button"
                    tabIndex={0}
                    aria-label="Edit address"
                    onClick={(e) => editAddress(e as unknown as MouseEvent, addr)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') editAddress(e as unknown as MouseEvent, addr);
                    }}
                  />
                  <div
                    className="AddressListItem__EditIcon-sc-wi2msz-7 AddressListItem__DeleteIcon-sc-wi2msz-9 eiUMmD fxKGaj"
                    role="button"
                    tabIndex={0}
                    aria-label="Delete address"
                    onClick={(e) => void deleteAddress(e as unknown as MouseEvent, addr.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void deleteAddress(e as unknown as MouseEvent, addr.id);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p style={{ padding: '16px 0', fontSize: 13, color: '#999' }}>
        {user ? 'No saved addresses yet.' : 'Log in to see saved addresses.'}
        <button
          type="button"
          onClick={goAddAddress}
          style={{
            display: 'block',
            marginTop: 8,
            border: 0,
            background: 'transparent',
            color: '#0c831f',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'Okra, Helvetica, sans-serif',
          }}
        >
          + Add new address
        </button>
      </p>
    );

  const suggestionBlock =
    query.trim().length >= 2 ? (
      <div className="bk-loc-suggestions">
        {searching ? (
          <p style={{ padding: 16, fontSize: 13, color: '#999' }}>Searching…</p>
        ) : suggestions.length === 0 ? (
          <p style={{ padding: 16, fontSize: 13, color: '#999' }}>No locations found</p>
        ) : (
          suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              className="LocationSearchList__LocationListContainer"
              onClick={() => applyLocation(s.fullAddress, s.lat, s.lng)}
            >
              <div>
                <div className="LocationSearchList__LocationLabel">
                  {s.description.split(',')[0] || s.fullAddress}
                </div>
                <div className="LocationSearchList__LocationDetails">{s.fullAddress}</div>
              </div>
            </button>
          ))
        )}
      </div>
    ) : null;

  const desktopPanel = (
    <div className="bk-loc-desktop" style={{ position: 'fixed', inset: 0, zIndex: 2002 }}>
      <button
        type="button"
        className="LocationDropDown__LocationOverlay-sc-bx29pc-1 bk-loc-overlay"
        aria-label="Dismiss"
        onClick={dismiss}
      />
      <div
        className="containers__DesktopContainer-sc-95cgcs-0 hAbKnj"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-change-location-title"
        style={{
          position: 'fixed',
          top: desktopTop,
          left: desktopLeft,
          width: PANEL_W,
          zIndex: 2003,
        }}
      >
        <div className="ChangeLocationV1__LocationContainer-sc-1sww6op-1 COygo">
          <div>
            <div className="LocationSelectorDesktopV1__DetectLocationContainer-sc-19zschz-2 dQvgyY">
              <div className="LocationSelectorDesktopV1__LocationBodyContainer-sc-19zschz-3 hQrfMz">
                <div className="LocationSelectorDesktopV1__LoginContainer-sc-19zschz-1 iLixdh">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 15,
                    }}
                  >
                    <div
                      id="bk-change-location-title"
                      className="welcome-to-grofers weight--semibold"
                      style={{ color: 'rgb(51, 51, 51)' }}
                    >
                      Change Location
                    </div>
                    <button
                      type="button"
                      onClick={dismiss}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: -20,
                        marginRight: -10,
                      }}
                      aria-label="Close"
                    >
                      <span className="icon-cross" />
                    </button>
                  </div>
                  {searchRow}
                  {error ? <div className="bk-loc-error">{error}</div> : null}
                </div>
              </div>
            </div>
          </div>

          {suggestionBlock}

          {!query.trim() ? (
            <div className="ChangeLocationV1__LocationBottom-sc-1sww6op-2 iklVqv">
              <div className="ChangeLocationV1__LocationAddressContainer-sc-1sww6op-4 fXRPjX">
                <div className="ChangeLocationV1__LocationListTitle-sc-1sww6op-5 iHPeDK">
                  Your saved addresses
                </div>
                {savedList}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  /* Mobile — same structure, full-width sheet */
  const mobilePanel = (
    <div className="bk-loc-mobile-sheet fixed inset-0 z-[2002] flex flex-col justify-end">
      <button
        type="button"
        className="LocationDropDown__LocationOverlay-sc-bx29pc-1 bk-loc-overlay absolute inset-0"
        aria-label="Dismiss"
        onClick={dismiss}
      />
      <div
        className="containers__DesktopContainer-sc-95cgcs-0 hAbKnj relative z-[2003]"
        style={{ width: '100%', maxHeight: '78vh', borderRadius: '16px 16px 0 0' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="ChangeLocationV1__LocationContainer-sc-1sww6op-1 COygo">
          <div className="LocationSelectorDesktopV1__DetectLocationContainer-sc-19zschz-2 dQvgyY">
            <div className="LocationSelectorDesktopV1__LocationBodyContainer-sc-19zschz-3 hQrfMz">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}
              >
                <div className="welcome-to-grofers weight--semibold" style={{ color: '#333' }}>
                  Change Location
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span className="icon-cross" />
                </button>
              </div>
              <button
                type="button"
                className="btn location-box mask-button"
                style={{ width: '100%', marginBottom: 12 }}
                onClick={useCurrentLocation}
                disabled={loadingGps}
              >
                {loadingGps ? 'Detecting…' : 'Detect my location'}
              </button>
              <input
                type="text"
                placeholder="search delivery location"
                className="LocationSearchBox__InputSelect-sc-1k8u6a6-0 fZCGlI"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {error ? <div className="bk-loc-error">{error}</div> : null}
            </div>
          </div>
          {suggestionBlock}
          {!query.trim() ? (
            <div className="ChangeLocationV1__LocationBottom-sc-1sww6op-2 iklVqv">
              <div className="ChangeLocationV1__LocationAddressContainer-sc-1sww6op-4 fXRPjX">
                <div className="ChangeLocationV1__LocationListTitle-sc-1sww6op-5 iHPeDK">
                  Your saved addresses
                </div>
                {savedList}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {desktopPanel}
      {mobilePanel}
    </>,
    document.body,
  );
}
