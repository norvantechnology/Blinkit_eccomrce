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
  const [menuAddr, setMenuAddr] = useState<Address | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSuggestions([]);
    setError('');
    setMenuAddr(null);
    setConfirmDelete(false);
    setDeleteTarget(null);
  }, [setOpen]);

  const { dismiss, dismissThen } = useCloseOnPopstate(open, close);

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
      dismissThen(() => {
        router.replace('/login');
      });
      return;
    }
    dismissThen(() => {
      router.push('/account/addresses?add=1');
    });
  };

  const deleteAddress = (e: MouseEvent, addr: Address) => {
    e.stopPropagation();
    setDeleteTarget(addr);
    setMenuAddr(null);
    setConfirmDelete(false);
  };

  const closeAddressMenu = () => {
    setMenuAddr(null);
    setConfirmDelete(false);
  };

  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
    setConfirmDelete(false);
  };

  const openAddressMenu = (e: MouseEvent, addr: Address) => {
    e.stopPropagation();
    setMenuAddr(addr);
    setConfirmDelete(false);
    setDeleteTarget(null);
  };

  const confirmDeleteAddress = async () => {
    const target = deleteTarget || (confirmDelete ? menuAddr : null);
    if (!target) return;
    try {
      await addressesService.remove(target.id);
      await reloadSaved();
      setDeleteTarget(null);
      closeAddressMenu();
    } catch {
      setError('Could not delete address');
      setConfirmDelete(false);
      setDeleteTarget(null);
    }
  };

  /** Edit → close location sheet cleanly, then open address modal on account page */
  const editAddress = (e: MouseEvent, addr: Address) => {
    e.stopPropagation();
    closeAddressMenu();
    if (!user) {
      dismissThen(() => {
        router.replace('/login');
      });
      return;
    }
    dismissThen(() => {
      router.push(`/account/addresses?edit=${encodeURIComponent(addr.id)}`);
    });
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
    <div className="bk-loc-desktop-search-row">
      <button
        type="button"
        className="btn location-box mask-button"
        onClick={useCurrentLocation}
        disabled={loadingGps}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/blinkit-parity/icons/location/detect-pin.svg"
          alt=""
          width={12}
          height={12}
          className="bk-loc-detect-pin"
        />
        {loadingGps ? 'Detecting…' : 'Detect my location'}
      </button>
      <div className="oval-container">
        <div className="oval">
          <span className="separator-text">
            <div className="or">OR</div>
          </span>
        </div>
      </div>
      <div className="bk-loc-desktop-search-field">
        <div className="modal-right__input-wrapper">
          <div className="display--table full-width">
            <div className="display--table-cell full-width">
              <div id="map-canvas" />
              <div className="bk-loc-desktop-search-wrap">
                <span className="bk-loc-desktop-search-ico" aria-hidden />
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
    </div>
  );

  const renderSavedList = (mode: 'desktop' | 'mobile') =>
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
                  {mode === 'mobile' ? (
                    <div
                      className="AddressListItem__EditIcon-sc-wi2msz-7 eiMFKo"
                      role="button"
                      tabIndex={0}
                      aria-label="Address options"
                      onClick={(e) => openAddressMenu(e as unknown as MouseEvent, addr)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          openAddressMenu(e as unknown as MouseEvent, addr);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/blinkit-parity/icons/location/more-dots.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="bk-loc-more-dots"
                      />
                    </div>
                  ) : (
                    <>
                      <div
                        className="AddressListItem__EditIcon-sc-wi2msz-7 eiUMmD bk-loc-desktop-ico"
                        role="button"
                        tabIndex={0}
                        aria-label="Edit address"
                        onClick={(e) => editAddress(e as unknown as MouseEvent, addr)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') editAddress(e as unknown as MouseEvent, addr);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/blinkit-parity/icons/location/edit-pencil.svg"
                          alt=""
                          width={14}
                          height={14}
                        />
                      </div>
                      <div
                        className="AddressListItem__EditIcon-sc-wi2msz-7 AddressListItem__DeleteIcon-sc-wi2msz-9 eiUMmD fxKGaj bk-loc-desktop-ico"
                        role="button"
                        tabIndex={0}
                        aria-label="Delete address"
                        onClick={(e) => deleteAddress(e as unknown as MouseEvent, addr)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            deleteAddress(e as unknown as MouseEvent, addr);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/blinkit-parity/icons/location/delete-trash.svg"
                          alt=""
                          width={14}
                          height={14}
                        />
                      </div>
                    </>
                  )}
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
        className="LocationDropDown__LocationOverlay-sc-bx29pc-1 bk-loc-overlay bk-dim-overlay"
        style={{ backgroundColor: 'rgba(50, 50, 50, 0.7)' }}
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
                {renderSavedList('desktop')}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  /* Mobile — Blinkit LocationModal DOM parity */
  const mobilePanel = (
    <div className="bk-loc-mobile-root">
      <button
        type="button"
        className="LocationDropDown__LocationOverlay-sc-bx29pc-1 bk-loc-overlay bk-dim-overlay"
        style={{ backgroundColor: 'rgba(50, 50, 50, 0.7)' }}
        aria-label="Dismiss"
        onClick={dismiss}
      />
      <div
        className="ReactModal__Content ReactModal__Content--after-open containers__MobileContainer-sc-95cgcs-1 hzvHjC modal-content mobile-content__bottomSheet LocationModal animation--delay-popup animation--enter-done"
        tabIndex={-1}
        role="dialog"
        aria-label="LocationModal"
        aria-modal="true"
      >
        <div
          className="LocationMobileTopV1__BackButtonIcon-sc-iandd-2 eNYZkv"
          role="button"
          tabIndex={0}
          onClick={dismiss}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              dismiss();
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/blinkit-parity/icons/location/close-slider.svg"
            alt="Closs Slider"
          />
        </div>
        <div>
          <div className="ChangeLocationV1__LocationContainer-sc-1sww6op-1 COygo">
            <div className="LocationMobileTopV1__Container-sc-iandd-0 bOYZpk">
              <div className="LocationMobileTopV1__LocationCityTitle-sc-iandd-1 jhpDgF">
                <div className="LocationMobileTopV1__LocationHeading-sc-iandd-3 eWmruh">
                  Select your Location
                </div>
              </div>
              <div className="LocationMobileTopV1__SearchContainer-sc-iandd-4 etGOdo">
                <div className="LocationInputV1__AddressSearchContainer-sc-vt691u-0 dCemrT">
                  <div className="LocationInputV1__AddressSearchBox-sc-vt691u-1 eSYJox">
                    <div className="relative">
                      <div className="search__box" data-test-id="search-box">
                        <button type="button" className="btn search__btn-v1" tabIndex={-1} aria-hidden />
                        <div className="modal-right__input-wrapper">
                          <div className="display--table full-width">
                            <div className="display--table-cell full-width">
                              <div id="map-canvas-mobile" />
                              <input
                                type="text"
                                name="select-locality"
                                placeholder="search delivery location"
                                autoComplete="off"
                                className="LocationSearchBox__InputSelect-sc-1k8u6a6-0 fZCGlI"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="LocationInputV1__LocationDetectButton-sc-vt691u-2 ghSsRI"
                    role="button"
                    tabIndex={0}
                    onClick={useCurrentLocation}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        useCurrentLocation();
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/blinkit-parity/icons/location/current-location.svg"
                      alt=""
                    />
                    {loadingGps ? 'Detecting…' : 'Use current location'}
                  </div>
                </div>
              </div>
              {error ? <div className="bk-loc-error">{error}</div> : null}
            </div>

            {query.trim().length >= 2 ? (
              suggestionBlock
            ) : (
              <div className="ChangeLocationV1__LocationBottom-sc-1sww6op-2 iklVqv">
                <div className="ChangeLocationV1__LocationAddressContainer-sc-1sww6op-4 dlnKNt">
                  <div className="ChangeLocationV1__LocationListTitle-sc-1sww6op-5 iHPeDK">
                    Your saved addresses
                  </div>
                  {renderSavedList('mobile')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );


  const showDeleteConfirm = Boolean(deleteTarget || (confirmDelete && menuAddr));

  const deleteConfirmModal = showDeleteConfirm ? (
    <div className="bk-loc-confirm-layer" role="alertdialog" aria-modal="true">
        <button
          type="button"
          className="bk-loc-confirm-layer__scrim bk-dim-overlay"
          style={{ backgroundColor: 'rgba(50, 50, 50, 0.7)' }}
          aria-label="Dismiss"
          onClick={closeDeleteConfirm}
        />
      <div className="bk-loc-confirm__card">
        <p className="bk-loc-confirm__text">Are you sure you want to delete this address?</p>
        <div className="bk-loc-confirm__row">
          <button type="button" className="bk-loc-confirm__btn" onClick={closeDeleteConfirm}>
            No
          </button>
          <button
            type="button"
            className="bk-loc-confirm__btn bk-loc-confirm__btn--yes"
            onClick={() => void confirmDeleteAddress()}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const addressActionSheet =
    menuAddr != null ? (
      <div className="bk-loc-action" role="presentation">
        <button
          type="button"
          className="bk-loc-action__scrim bk-dim-overlay"
          style={{ backgroundColor: 'rgba(50, 50, 50, 0.7)' }}
          aria-label="Dismiss"
          onClick={closeAddressMenu}
        />
        <div className="bk-loc-action__sheet">
          <div className="bk-loc-action__group">
            <button
              type="button"
              className="bk-loc-action__btn bk-loc-action__btn--delete"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
            <button
              type="button"
              className="bk-loc-action__btn bk-loc-action__btn--edit"
              onClick={(e) => editAddress(e as unknown as MouseEvent, menuAddr)}
            >
              Edit
            </button>
          </div>
          <div className="bk-loc-action__group">
            <button
              type="button"
              className="bk-loc-action__btn bk-loc-action__btn--cancel"
              onClick={closeAddressMenu}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return createPortal(
    <>
      {desktopPanel}
      {mobilePanel}
      {addressActionSheet}
      {deleteConfirmModal}
    </>,
    document.body,
  );
}
