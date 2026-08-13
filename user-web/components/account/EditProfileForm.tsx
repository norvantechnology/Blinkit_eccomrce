'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, setStoredUser } from '@/lib/auth';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { cn } from '@/lib/utils';
import { useI18n, setStoredLocale } from '@/lib/i18n/useI18n';
import type { Locale } from '@/lib/i18n/messages';

type Props = {
  onSaved?: () => void;
};

export function EditProfileForm({ onSaved }: Props) {
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setAvatarUrl(user.avatarUrl || null);
    setLanguagePref(user.languagePref === 'hi' ? 'hi' : 'en');
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      if (password.trim().length > 0 && password.trim().length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      let merged = await usersService.updateMe({
        name: name.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        avatarUrl,
        languagePref,
      });
      setStoredLocale(languagePref);

      if (password.trim().length >= 6) {
        merged = await authService.setPassword(password.trim());
        setPassword('');
      }

      setUser(merged);
      setStoredUser(merged);
      setSaved(true);
      onSaved?.();
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
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[520px] lg:mx-0">
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</p>
      )}
      {saved && !error && (
        <p className="mb-4 rounded-xl bg-[#f0faf2] px-3 py-2 text-[13px] font-semibold text-[#0C831F]">
          {t('settings.saved')}
        </p>
      )}

      <section className="flex flex-col items-center border-b border-[#f0f0f0] pb-6 lg:items-start">
        <p className="mb-3 w-full text-[13px] font-semibold text-[#1f1f1f]">{t('settings.photo')}</p>
        <AvatarUpload
          value={avatarUrl}
          onUploaded={(file) => setAvatarUrl(file.url)}
          onClear={() => setAvatarUrl(null)}
        />
      </section>

      <section className="space-y-4 border-b border-[#f0f0f0] py-6">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">
            {t('settings.name')}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="h-12 w-full rounded-xl border border-[#e4e4e4] px-3.5 text-[15px] outline-none focus:border-[#0C831F]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">
            {t('settings.email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="name@example.com"
            className="h-12 w-full rounded-xl border border-[#e4e4e4] px-3.5 text-[15px] outline-none focus:border-[#0C831F]"
          />
        </div>
      </section>

      <section className="border-b border-[#f0f0f0] py-6">
        <p className="mb-3 text-[13px] font-semibold text-[#1f1f1f]">{t('settings.language')}</p>
        <div className="grid grid-cols-2 gap-2">
          {locales.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguagePref(lang.code)}
              className={cn(
                'h-12 rounded-xl text-[14px] font-bold',
                languagePref === lang.code
                  ? 'bg-[#0C831F] text-white'
                  : 'bg-[#f5f5f5] text-[#555]',
              )}
            >
              {lang.nativeLabel}
            </button>
          ))}
        </div>
      </section>

      <section className="py-6">
        <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">
          {t('settings.password')}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="••••••••"
          className="h-12 w-full rounded-xl border border-[#e4e4e4] px-3.5 text-[15px] outline-none focus:border-[#0C831F]"
        />
        <p className="mt-2 text-[12px] leading-relaxed text-[#8a8a8a]">{t('settings.passwordHint')}</p>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="h-12 w-full rounded-xl bg-[#0C831F] text-[15px] font-bold text-white hover:bg-[#097019] disabled:opacity-60"
      >
        {saving ? t('settings.saving') : t('settings.save')}
      </button>
    </form>
  );
}
