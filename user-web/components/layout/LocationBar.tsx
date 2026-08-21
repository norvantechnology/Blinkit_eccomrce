'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useUiStore } from '@/store/uiStore';
import { addressesService } from '@/services/addresses.service';
import { blinkitTokens } from '@/lib/design-tokens';

/** LocationBar — Blinkit gcLVHe / bdWwbr / fqbcdJ measurements. */
export function LocationBar({
  className,
  compact = false,
}: {
  className?: string;
  /** @deprecated layout handled by CSS breakpoints */
  compact?: boolean;
}) {
  void compact;
  const btnRef = useRef<HTMLButtonElement>(null);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const location = useLocationStore((s) => s.location);
  const loading = useLocationStore((s) => s.loading);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setLoading = useLocationStore((s) => s.setLoading);
  const setDefaultStoreLocation = useLocationStore((s) => s.setDefaultStoreLocation);
  const locationPickerOpen = useUiStore((s) => s.locationPickerOpen);
  const setLocationPickerOpen = useUiStore((s) => s.setLocationPickerOpen);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          if (user) {
            const addresses = await addressesService.list();
            if (cancelled) return;
            const preferred = addresses.find((a) => a.isDefault) || addresses[0];
            if (preferred) {
              setLocation({
                label: preferred.label === 'home' ? 'Home' : preferred.label === 'work' ? 'Work' : 'Other',
                fullAddress: preferred.fullAddress,
                lat: preferred.lat ?? blinkitTokens.defaultStore.lat,
                lng: preferred.lng ?? blinkitTokens.defaultStore.lng,
                etaMinutes: blinkitTokens.defaultStore.etaMinutes,
              });
              return;
            }
          }
          setDefaultStoreLocation();
        } catch {
          if (!cancelled) setDefaultStoreLocation();
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [hydrated, user, setDefaultStoreLocation, setLoading, setLocation]);

  const displayLocation =
    location ??
    (!hydrated
      ? {
          label: 'Home',
          fullAddress: blinkitTokens.defaultStore.fullAddress,
          lat: blinkitTokens.defaultStore.lat,
          lng: blinkitTokens.defaultStore.lng,
          etaMinutes: blinkitTokens.defaultStore.etaMinutes,
        }
      : null);

  const addressLine = displayLocation?.fullAddress || 'Select location';

  const openPicker = () => {
    if (locationPickerOpen) {
      setLocationPickerOpen(false);
      return;
    }
    const el = btnRef.current;
    if (!el) {
      setLocationPickerOpen(true);
      return;
    }
    // Prefer eta text block so popup centers under “Delivery in …” copy (Blinkit)
    const eta = el.querySelector('.bk-location__eta') as HTMLElement | null;
    const r = (eta ?? el).getBoundingClientRect();
    setLocationPickerOpen(true, {
      top: r.top,
      left: r.left,
      bottom: el.getBoundingClientRect().bottom,
      width: r.width,
      right: r.right,
    });
  };

  return (
    <button
      ref={btnRef}
      type="button"
      id="header-location-trigger"
      aria-expanded={locationPickerOpen}
      aria-haspopup="dialog"
      onClick={openPicker}
      className={cn('bk-location', className)}
    >
      <div className="bk-location__eta">
        {loading && !displayLocation ? (
          <>
            <div className="blinkit-shimmer mb-1.5 h-[21px] w-40 rounded-lg" />
            <div className="blinkit-shimmer h-3.5 w-52 rounded-lg" />
          </>
        ) : (
          <>
            <p className="bk-location__title">
              Delivery in {displayLocation?.etaMinutes ?? blinkitTokens.defaultStore.etaMinutes}{' '}
              minutes
            </p>
            <div className="bk-location__subrow">
              <span className="bk-location__sub">
                {displayLocation?.label ? (
                  <>
                    <span className="bk-location__label">{displayLocation.label}</span>
                    <span className="bk-location__sep"> - </span>
                  </>
                ) : null}
                <span className="bk-location__address">{addressLine}</span>
              </span>
              <span className="bk-location__arrow" aria-hidden />
            </div>
          </>
        )}
      </div>
    </button>
  );
}
