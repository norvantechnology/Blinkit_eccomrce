'use client';

import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, setStoredUser } from '@/lib/auth';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { cn } from '@/lib/utils';
import { useI18n, setStoredLocale } from '@/lib/i18n/useI18n';
import type { Locale } from '@/lib/i18n/messages';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function EditProfileModal({ open, onClose, onSaved }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { t, locales } = useI18n();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [languagePref, setLanguagePref] = useState<Locale>('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setAvatarUrl(user.avatarUrl || null);
    setLanguagePref(user.languagePref === 'hi' ? 'hi' : 'en');
    setPassword('');
    setError('');
  }, [open, user]);

  if (!open || !user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updatedProfile = await usersService.updateMe({
        name: name.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        avatarUrl,
      });
      const updatedLang = await usersService.updateLanguage(languagePref);
      setStoredLocale(languagePref);
      let merged = { ...updatedProfile, ...updatedLang };
      if (password.trim().length >= 6) {
        merged = { ...merged, ...(await authService.setPassword(password.trim())) };
        setPassword('');
      } else if (password.trim().length > 0) {
        throw new Error('Password must be at least 6 characters');
      }
      setUser(merged);
      setStoredUser(merged);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message.startsWith('Password')
          ? err.message
          : getApiErrorMessage(err, 'Could not save profile'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#eee] px-5 py-4">
          <h2 className="text-[17px] font-extrabold text-[#1f1f1f]">{t('settings.editProfile')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#666] hover:bg-[#f5f5f5]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4">
          {error && <p className="mb-3 text-[13px] text-red-600">{error}</p>}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[13px] font-semibold text-[#1f1f1f]">{t('settings.photo')}</p>
              <AvatarUpload
                value={avatarUrl}
                onUploaded={(file) => setAvatarUrl(file.url)}
                onClear={() => setAvatarUrl(null)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">{t('settings.name')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-[#dcdcdc] px-3 text-[14px] outline-none focus:border-[#0C831F]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">{t('settings.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#dcdcdc] px-3 text-[14px] outline-none focus:border-[#0C831F]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">{t('settings.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-[#dcdcdc] px-3 text-[14px] outline-none focus:border-[#0C831F]"
              />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-[#1f1f1f]">{t('settings.language')}</p>
              <div className="flex gap-2">
                {locales.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguagePref(lang.code)}
                    className={cn(
                      'h-10 flex-1 rounded-lg text-[13px] font-bold',
                      languagePref === lang.code ? 'bg-[#0C831F] text-white' : 'bg-[#f5f5f5] text-[#666]',
                    )}
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 h-11 w-full rounded-lg bg-[#0C831F] text-[14px] font-bold text-white hover:bg-[#097019] disabled:opacity-60"
          >
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
