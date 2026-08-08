'use client';

import { useCallback, useEffect, useState } from 'react';
import { Briefcase, Home, MapPin, MoreVertical, Plus } from 'lucide-react';
import { AddressModal } from '@/components/account/AddressModal';
import { addressesService, type Address } from '@/services/addresses.service';
import { getApiErrorMessage } from '@/lib/auth';
import { blinkitTokens } from '@/lib/design-tokens';
import { useLocationStore } from '@/store/locationStore';

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

export default function AddressesPage() {
  const setLocation = useLocationStore((s) => s.setLocation);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await addressesService.list();
      setAddresses(list);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load addresses'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    <div>
      <h1 className="text-[22px] font-extrabold leading-tight text-[#1f1f1f] lg:text-[24px]">
        My addresses
      </h1>
      <button
        type="button"
        onClick={openAdd}
        className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-[#0C831F]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Add new address
      </button>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3 py-2">
            <div className="blinkit-shimmer h-[72px] rounded-lg" />
            <div className="blinkit-shimmer h-[72px] rounded-lg" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[14px] text-[#888]">No saved addresses yet.</p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-3 text-[14px] font-semibold text-[#0C831F]"
            >
              + Add new address
            </button>
          </div>
        ) : (
          <ul>
            {addresses.map((addr) => (
              <li key={addr.id} className="relative flex items-start gap-3 py-4">
                <LabelIcon label={addr.label} />
                <div className="min-w-0 flex-1 pr-10">
                  <p className="text-[15px] font-bold text-[#1f1f1f]">{labelTitle(addr.label)}</p>
                  <p className="mt-1 text-[13px] leading-snug text-[#888]">{addr.fullAddress}</p>
                </div>
                <div className="absolute right-0 top-3">
                  <button
                    type="button"
                    aria-label="Address options"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuId((id) => (id === addr.id ? null : addr.id));
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#0C831F]"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {menuId === addr.id ? (
                    <div
                      className="absolute right-0 top-10 z-20 min-w-[150px] overflow-hidden rounded-lg border border-[#eee] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-[#f7f7f7]"
                        onClick={() => openEdit(addr)}
                      >
                        Edit
                      </button>
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          className="block w-full px-3 py-2.5 text-left text-[13px] hover:bg-[#f7f7f7]"
                          onClick={() => handleDefault(addr.id)}
                        >
                          Set as default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-[13px] text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(addr.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
