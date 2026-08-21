'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AddressModal } from '@/components/account/AddressModal';
import { addressesService, type Address } from '@/services/addresses.service';
import { getApiErrorMessage } from '@/lib/auth';
import { blinkitTokens } from '@/lib/design-tokens';
import { useLocationStore } from '@/store/locationStore';

/** Live Blinkit CDN icons (v5 light) — same URLs as blinkit.com */
const ICON = {
  home: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=90/layout-engine/v2/2025-02/address_home_icon_v5/address_home_icon_v5_light.png',
  work: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=90/layout-engine/v2/2025-02/address_work_icon_v5/address_work_icon_v5_light.png',
  other: '/blinkit-parity/icons/address/address-other.png',
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

/** Exact Blinkit /account/addresses DOM (UserAddressesV2 + AddressCard). */
function AddressesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setLocation = useLocationStore((s) => s.setLocation);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const clearAddressQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has('edit') && !params.has('add')) return;
    params.delete('edit');
    params.delete('add');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await addressesService.list();
      setAddresses(list);
      return list;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load addresses'));
      return [] as Address[];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Deep-link from Change Location edit/add → open Enter complete address modal */
  useEffect(() => {
    const editId = searchParams.get('edit');
    const add = searchParams.get('add');
    if (!editId && add !== '1') return;

    let cancelled = false;
    void (async () => {
      let list = addresses;
      if (list.length === 0) {
        try {
          list = await addressesService.list();
          if (!cancelled) setAddresses(list);
        } catch {
          if (!cancelled) clearAddressQuery();
          return;
        }
      }
      if (cancelled) return;

      if (editId) {
        const found = list.find((a) => a.id === editId) ?? null;
        if (found) {
          setEditing(found);
          setModalOpen(true);
        } else {
          clearAddressQuery();
        }
        return;
      }

      setEditing(null);
      setModalOpen(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open only when query changes
  }, [searchParams]);

  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  const syncHeaderLocation = (addr: Address) => {
    if (!addr.isDefault) return;
    setLocation({
      label: labelTitle(addr.label),
      fullAddress: addr.fullAddress,
      lat: addr.lat ?? blinkitTokens.defaultStore.lat,
      lng: addr.lng ?? blinkitTokens.defaultStore.lng,
      etaMinutes: blinkitTokens.defaultStore.etaMinutes,
    });
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setModalOpen(true);
    setMenuId(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    clearAddressQuery();
  };

  const handleSaved = async (addr: Address) => {
    syncHeaderLocation(addr);
    await load();
  };

  const handleDefault = async (id: string) => {
    setMenuId(null);
    try {
      const updated = await addressesService.setDefault(id);
      syncHeaderLocation({ ...updated, isDefault: true });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not set default'));
    }
  };

  const handleDelete = async (id: string) => {
    setMenuId(null);
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressesService.remove(id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete address'));
    }
  };

  return (
    <div className="UserAddressesV2__UserAddressesWrapper-sc-bnlqpe-3 icnSoU">
      <div className="UserAddressesV2__MyAddresses-sc-bnlqpe-1 ZgErW my-addresses">
        <div className="UserAddressesV2__MyAddressTitle-sc-bnlqpe-5 bVQOWk">My addresses</div>

        <div className="UserAddressesV2__MyAddressLableContainer-sc-bnlqpe-4 fA-DOkf">
          <div className="UserAddressesV2__AddAddressLinkContainer-sc-bnlqpe-6 gcOdsi">
            <div
              data-test-id="add-new-address"
              className="UserAddressesV2__AddAddressLink-sc-bnlqpe-9 eaZfsM"
              role="button"
              tabIndex={0}
              onClick={openAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openAdd();
                }
              }}
            >
              <div className="UserAddressesV2__AddIconContainer-sc-bnlqpe-8 fMgxzu">
                <span
                  className="icon-plus tw-inline-flex"
                  role="img"
                  data-pf="reset"
                  style={{ fontSize: 12 }}
                />
              </div>
              Add new address
            </div>
          </div>
        </div>

        {error ? <div className="ua-error">{error}</div> : null}

        <div className="UserAddressesV2__AddressCardsContainer-sc-bnlqpe-0 hQbPyu">
          {loading ? (
            <>
              <div className="AddressCard__CardContainer-sc-1v9p7y9-3 jYQcBy blinkit-shimmer" style={{ height: 52 }} />
              <div className="AddressCard__CardContainer-sc-1v9p7y9-3 jYQcBy blinkit-shimmer" style={{ height: 52 }} />
            </>
          ) : addresses.length === 0 ? (
            <div className="ua-empty">
              <p>No saved addresses yet.</p>
              <div
                data-test-id="add-new-address"
                className="UserAddressesV2__AddAddressLink-sc-bnlqpe-9 eaZfsM"
                role="button"
                tabIndex={0}
                onClick={openAdd}
              >
                <div className="UserAddressesV2__AddIconContainer-sc-bnlqpe-8 fMgxzu">
                  <span className="icon-plus tw-inline-flex" role="img" style={{ fontSize: 12 }} />
                </div>
                Add new address
              </div>
            </div>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} className="AddressCard__CardContainer-sc-1v9p7y9-3 jYQcBy">
                <div
                  className="Imagestyles__ImageContainer-sc-1u3ccmn-0 kGyXMV"
                  style={{ width: 40, height: 40 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iconSrc(addr.label)}
                    alt={labelTitle(addr.label)}
                    width={40}
                    height={40}
                    loading="lazy"
                    style={{
                      borderRadius: 0,
                      objectFit: 'fill',
                      cursor: 'default',
                    }}
                  />
                </div>
                <div className="AddressCard__AddressDetails-sc-1v9p7y9-4 kaAnRm">
                  <div className="AddressCard__AddressLabel-sc-1v9p7y9-5 fgjWho">
                    <span className="AddressCard__AddressLabelText-sc-1v9p7y9-6 mxNpW">
                      {labelTitle(addr.label)}
                    </span>
                  </div>
                  <span className="AddressCard__DisplayAddress-sc-1v9p7y9-8 caIBbB">
                    {addr.fullAddress}
                  </span>
                </div>
                <div className="AddressCard__TooltipContainer-sc-1v9p7y9-0 hzYeJY">
                  <a
                    className="AddressCard__TooltipIcon-sc-1v9p7y9-1 kiZofv"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuId((id) => (id === addr.id ? null : addr.id));
                    }}
                  >
                    Ý
                  </a>
                  {menuId === addr.id ? (
                    <div
                      className="AddressCard__AddressItemActions-sc-1v9p7y9-2 ua-card__menu-pop"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button type="button" onClick={() => openEdit(addr)}>
                        Edit
                      </button>
                      {!addr.isDefault ? (
                        <button type="button" onClick={() => handleDefault(addr.id)}>
                          Set as default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => handleDelete(addr.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddressModal
        open={modalOpen}
        onClose={closeModal}
        editing={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}

export default function AddressesPage() {
  return (
    <Suspense
      fallback={
        <div className="UserAddressesV2__UserAddressesWrapper-sc-bnlqpe-3 icnSoU">
          <div className="UserAddressesV2__MyAddresses-sc-bnlqpe-1 ZgErW my-addresses">
            <div className="UserAddressesV2__MyAddressTitle-sc-bnlqpe-5 bVQOWk">My addresses</div>
            <div className="UserAddressesV2__AddressCardsContainer-sc-bnlqpe-0 hQbPyu">
              <div
                className="AddressCard__CardContainer-sc-1v9p7y9-3 jYQcBy blinkit-shimmer"
                style={{ height: 52 }}
              />
            </div>
          </div>
        </div>
      }
    >
      <AddressesPageContent />
    </Suspense>
  );
}
