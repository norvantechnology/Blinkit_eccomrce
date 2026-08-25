'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { buildSelectedLocation, useLocationStore } from '@/store/locationStore';
import { useUiStore } from '@/store/uiStore';
import { addressesService } from '@/services/addresses.service';
import { blinkitTokens } from '@/lib/design-tokens';
import { useI18n } from '@/lib/i18n/useI18n';
import type { MessageKey } from '@/lib/i18n/messages';

function localizeLabel(label: string | undefined, t: (key: MessageKey) => string) {
  if (!label) return undefined;
  const map: Record<string, MessageKey> = {
    Home: 'location.home',
    Work: 'location.work',
    Other: 'location.other',
    Hotel: 'location.hotel',
    Current: 'location.current',
    घर: 'location.home',
    कार्यालय: 'location.work',
    अन्य: 'location.other',
    होटल: 'location.hotel',
    वर्तमान: 'location.current',
  };
  const key = map[label];
  return key ? t(key) : label;
}

function labelFromAddress(label: string) {
  if (label === 'home') return 'Home';
  if (label === 'work') return 'Work';
  return 'Other';
}

/** LocationBar - Blinkit gcLVHe / bdWwbr / fqbcdJ measurements. */
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
  const locationPickerOpen = useUiStore((s) => s.locationPickerOpen);
  const setLocationPickerOpen = useUiStore((s) => s.setLocationPickerOpen);
  const { t } = useI18n();

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;
    // Always start clean on mount/refresh - no static MG Road pin
    setLocation(null);

    const id = window.setTimeout(() => {
      void (async () => {
        // Guests: leave empty until they pick / detect
        if (!user) {
          if (!cancelled) setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const addresses = await addressesService.list();
          if (cancelled) return;
          const preferred = addresses.find((a) => a.isDefault) || addresses[0];
          // Only restore real saved pins (never invent coordinates)
          if (
            preferred &&
            preferred.lat != null &&
            preferred.lng != null &&
            Number.isFinite(preferred.lat) &&
            Number.isFinite(preferred.lng)
          ) {
            setLocation(
              buildSelectedLocation({
                label: labelFromAddress(preferred.label),
                fullAddress: preferred.fullAddress,
                lat: preferred.lat,
                lng: preferred.lng,
              }),
            );
          } else {
            setLocation(null);
          }
        } catch {
          if (!cancelled) setLocation(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [hydrated, user, setLoading, setLocation]);

  const addressLine = location?.fullAddress || t('location.selectLocation');
  const etaMinutes = location?.etaMinutes ?? blinkitTokens.deliveryEtaMinutes;

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
        {loading && !location ? (
          <>
            <div className="blinkit-shimmer mb-1.5 h-[21px] w-40 rounded-lg" />
            <div className="blinkit-shimmer h-3.5 w-52 rounded-lg" />
          </>
        ) : (
          <>
            <p className="bk-location__title">
              {t('location.deliveryIn', { n: etaMinutes })}
            </p>
            <div className="bk-location__subrow">
              <span className="bk-location__sub">
                {location?.label ? (
                  <>
                    <span className="bk-location__label">
                      {localizeLabel(location.label, t)}
                    </span>
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
