'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  countryCodesService,
  flagUrl,
  type CountryCode,
  type CountryCodeInput,
} from '@/services/country-codes.service';

const EMPTY: CountryCodeInput = {
  name: '',
  isoCode: '',
  dialCode: '+',
  minLength: 10,
  maxLength: 10,
  isActive: true,
  isDefault: false,
  sortOrder: 0,
};

const PRESETS: Array<Pick<CountryCodeInput, 'name' | 'isoCode' | 'dialCode' | 'minLength' | 'maxLength'>> = [
  { name: 'India', isoCode: 'IN', dialCode: '+91', minLength: 10, maxLength: 10 },
  { name: 'United States', isoCode: 'US', dialCode: '+1', minLength: 10, maxLength: 10 },
  { name: 'United Kingdom', isoCode: 'GB', dialCode: '+44', minLength: 10, maxLength: 10 },
  { name: 'United Arab Emirates', isoCode: 'AE', dialCode: '+971', minLength: 9, maxLength: 9 },
  { name: 'Saudi Arabia', isoCode: 'SA', dialCode: '+966', minLength: 9, maxLength: 9 },
  { name: 'Canada', isoCode: 'CA', dialCode: '+1', minLength: 10, maxLength: 10 },
  { name: 'Australia', isoCode: 'AU', dialCode: '+61', minLength: 9, maxLength: 9 },
  { name: 'Singapore', isoCode: 'SG', dialCode: '+65', minLength: 8, maxLength: 8 },
  { name: 'Nepal', isoCode: 'NP', dialCode: '+977', minLength: 10, maxLength: 10 },
  { name: 'Bangladesh', isoCode: 'BD', dialCode: '+880', minLength: 10, maxLength: 10 },
];

const apiError = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string; errors?: { message: string }[] } } })?.response
    ?.data?.errors?.[0]?.message ||
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

export default function CountryCodesPage() {
  const [rows, setRows] = useState<CountryCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CountryCodeInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(
    () =>
      countryCodesService
        .list()
        .then(setRows)
        .catch((err) => setError(apiError(err, 'Could not load country codes')))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const flash = (text: string) => {
    setError('');
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2500);
  };

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const set = <K extends keyof CountryCodeInput>(key: K, value: CountryCodeInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const applyPreset = (iso: string) => {
    const preset = PRESETS.find((p) => p.isoCode === iso);
    if (preset) setForm((f) => ({ ...f, ...preset }));
  };

  const startEdit = (row: CountryCode) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      isoCode: row.isoCode,
      dialCode: row.dialCode,
      minLength: row.minLength,
      maxLength: row.maxLength,
      isActive: row.isActive,
      isDefault: row.isDefault,
      sortOrder: row.sortOrder,
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form, isoCode: form.isoCode.trim().toUpperCase(), name: form.name.trim() };
    try {
      if (editingId) {
        await countryCodesService.update(editingId, payload);
        flash(`${payload.name} updated`);
      } else {
        await countryCodesService.create(payload);
        flash(`${payload.name} added - now visible on login`);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(apiError(err, 'Could not save country code'));
    } finally {
      setSaving(false);
    }
  };

  const patchRow = async (row: CountryCode, input: Partial<CountryCodeInput>, done: string) => {
    setBusyId(row.id);
    setError('');
    try {
      await countryCodesService.update(row.id, input);
      flash(done);
      await load();
    } catch (err) {
      setError(apiError(err, 'Could not update country code'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row: CountryCode) => {
    if (!window.confirm(`Delete ${row.name} (${row.dialCode})?`)) return;
    setBusyId(row.id);
    setError('');
    try {
      await countryCodesService.remove(row.id);
      if (editingId === row.id) resetForm();
      flash(`${row.name} deleted`);
      await load();
    } catch (err) {
      setError(apiError(err, 'Could not delete country code'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f]">Country codes</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Countries customers can pick in the phone login box. Only active countries are shown; the
          default one is pre-selected.
        </p>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#1f1f1f]">
              {editingId ? `Edit ${form.name || 'country'}` : 'Add country'}
            </h2>
            {!editingId && (
              <select
                className="h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm text-[#333] outline-none focus:border-[var(--primary)]"
                value=""
                onChange={(e) => applyPreset(e.target.value)}
                aria-label="Quick fill from a common country"
              >
                <option value="">Quick fill…</option>
                {PRESETS.filter((p) => !rows.some((r) => r.isoCode === p.isoCode)).map((p) => (
                  <option key={p.isoCode} value={p.isoCode}>
                    {p.name} ({p.dialCode})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              id="cc-name"
              label="Country name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="United Arab Emirates"
              required
            />
            <Input
              id="cc-iso"
              label="ISO code (2 letters)"
              value={form.isoCode}
              onChange={(e) => set('isoCode', e.target.value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase())}
              placeholder="AE"
              hint="Used for the flag image"
              required
            />
            <Input
              id="cc-dial"
              label="Dial code"
              value={form.dialCode}
              onChange={(e) => set('dialCode', `+${e.target.value.replace(/\D/g, '').slice(0, 4)}`)}
              placeholder="+971"
              required
            />
            <Input
              id="cc-min"
              type="number"
              label="Min digits"
              min={4}
              max={14}
              value={form.minLength}
              onChange={(e) => set('minLength', Number(e.target.value))}
              required
            />
            <Input
              id="cc-max"
              type="number"
              label="Max digits"
              min={4}
              max={14}
              value={form.maxLength}
              onChange={(e) => set('maxLength', Number(e.target.value))}
              required
            />
            <Input
              id="cc-order"
              type="number"
              label="Sort order"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
              hint="Lower shows first"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-[#333]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--primary)]"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
              />
              Active (show on login)
            </label>
            <label className="flex items-center gap-2 text-sm text-[#333]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--primary)]"
                checked={form.isDefault}
                onChange={(e) => set('isDefault', e.target.checked)}
              />
              Default selection
            </label>
          </div>

          {error && <p className="rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && (
            <p className="rounded-[var(--radius-md)] bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={saving} leftIcon={editingId ? undefined : <Plus className="h-4 w-4" />}>
              {editingId ? 'Save changes' : 'Add country'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} leftIcon={<X className="h-4 w-4" />}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted-foreground)]">
            No country codes yet. Customers will see India (+91) until you add one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[var(--surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Dial code</th>
                  <th className="px-4 py-3">Digits</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((row) => (
                  <tr key={row.id} className={cn(editingId === row.id && 'bg-emerald-50/50')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={flagUrl(row.isoCode)}
                          alt=""
                          width={24}
                          height={18}
                          className="h-[18px] w-6 rounded-sm object-cover ring-1 ring-black/10"
                        />
                        <div>
                          <div className="font-semibold text-[#1f1f1f]">{row.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{row.isoCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1f1f1f]">{row.dialCode}</td>
                    <td className="px-4 py-3 text-[#333]">
                      {row.minLength === row.maxLength ? row.minLength : `${row.minLength}–${row.maxLength}`}
                    </td>
                    <td className="px-4 py-3 text-[#333]">{row.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() =>
                            void patchRow(row, { isActive: !row.isActive }, `${row.name} ${row.isActive ? 'hidden' : 'activated'}`)
                          }
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50',
                            row.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                          )}
                          title={row.isActive ? 'Click to hide from login' : 'Click to show on login'}
                        >
                          {row.isActive ? 'Active' : 'Hidden'}
                        </button>
                        {row.isDefault ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Star className="h-3 w-3 fill-current" /> Default
                          </span>
                        ) : (
                          row.isActive && (
                            <button
                              type="button"
                              disabled={busyId === row.id}
                              onClick={() => void patchRow(row, { isDefault: true }, `${row.name} is now default`)}
                              className="rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                            >
                              Make default
                            </button>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(row)} aria-label={`Edit ${row.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={row.isDefault || busyId === row.id}
                          onClick={() => void handleDelete(row)}
                          aria-label={`Delete ${row.name}`}
                          title={row.isDefault ? 'Set another default before deleting' : undefined}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
