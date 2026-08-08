'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useUiStore } from '@/store/uiStore';
import { addressesService } from '@/services/addresses.service';
import { blinkitTokens } from '@/lib/design-tokens';

export function LocationBar({
  className,
  compact = false,
}: {
  className?: string;
  /** Mobile Blinkit: tighter type, address only (no label prefix) */
  compact?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const location = useLocationStore((s) => s.location);
  const loading = useLocationStore((s) => s.loading);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setLoading = useLocationStore((s) => s.setLoading);
  const setDefaultStoreLocation = useLocationStore((s) => s.setDefaultStoreLocation);
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

  const addressLine = location?.fullAddress || 'Select location';

  return (
    <button
      type="button"
      onClick={() => setLocationPickerOpen(true)}
      className={cn(
        'flex w-full min-w-0 flex-col justify-center text-left',
        !compact && 'h-[86px] shrink-0 hover:bg-[var(--header-hover)]',
        className,
      )}
    >
      {loading || !location ? (
        <div className="w-full space-y-1.5">
          <div className="blinkit-shimmer h-5 w-40 rounded" />
          <div className="blinkit-shimmer h-3.5 w-52 rounded" />
        </div>
      ) : (
        <>
          <p
            className={cn(
              'font-extrabold leading-tight text-[#1f1f1f]',
              compact ? 'text-[16px]' : 'text-[16px] lg:text-[18px]',
            )}
          >
            Delivery in {location.etaMinutes} minutes
          </p>
          <p
            className={cn(
              'mt-0.5 flex max-w-full items-center gap-1 font-medium text-[#666]',
              compact ? 'text-[12px]' : 'text-[12px] lg:text-[13px]',
            )}
          >
            <span className="truncate">{addressLine}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden className="shrink-0">
              <path d="M1 1l4 4 4-4" stroke="#1f1f1f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </p>
        </>
      )}
    </button>
  );
}
