'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, setStoredUser } from '@/lib/auth';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { cn } from '@/lib/utils';
import { useI18n, setStoredLocale } from '@/lib/i18n/useI18n';
import type { Locale } from '@/lib/i18n/messages';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { t, locales } = useI18n();

  const [languagePref, setLanguagePref] = useState<Locale>(
    (user?.languagePref as Locale) === 'hi' ? 'hi' : 'en',
  );
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setAvatarUrl(user.avatarUrl || null);
    setLanguagePref(user.languagePref === 'hi' ? 'hi' : 'en');
  }, [user]);

  if (!user) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
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
        const withPassword = await authService.setPassword(password.trim());
        merged = { ...merged, ...withPassword };
        setPassword('');
      } else if (password.trim().length > 0) {
        throw new Error('Password must be at least 6 characters');
      }
      setUser(merged);
      setStoredUser(merged);
      setMessage(t('settings.saved'));
    } catch (err) {
      setError(err instanceof Error && err.message.startsWith('Password')
        ? err.message
        : getApiErrorMessage(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('settings.deleteConfirm'))) return;
    try {
      await authService.deleteAccount();
      logout();
      router.replace('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete account'));
    }
  };

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[#1f1f1f] sm:text-[24px]">{t('settings.title')}</h1>
      <p className="mt-1 text-[13px] text-[#888]">{t('settings.subtitle')}</p>

      <form onSubmit={handleSave} className="mt-6 max-w-md space-y-4">
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        {message && <p className="text-[13px] text-emerald-700">{message}</p>}

        <div>
          <p className="mb-2 text-[13px] font-semibold text-[#1f1f1f]">{t('settings.photo')}</p>
          <AvatarUpload
            value={avatarUrl}
            onUploaded={(file) => setAvatarUrl(file.url)}
            onClear={() => setAvatarUrl(null)}
          />
        </div>

        <div>
          <label htmlFor="privacy-name" className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">
            {t('settings.name')}
          </label>
          <input
            id="privacy-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11 w-full rounded-lg border border-[#dcdcdc] px-3 text-[14px] outline-none focus:border-[#0C831F]"
          />
        </div>
        <div>
          <label htmlFor="privacy-email" className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">
            {t('settings.email')}
          </label>
          <input
            id="privacy-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-[#dcdcdc] px-3 text-[14px] outline-none focus:border-[#0C831F]"
          />
        </div>

        <div>
          <label htmlFor="privacy-password" className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">
            {t('settings.password')}
          </label>
          <p className="mb-1.5 text-[12px] text-[#999]">{t('settings.passwordHint')}</p>
          <input
            id="privacy-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
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
                  languagePref === lang.code
                    ? 'bg-[#0C831F] text-white'
                    : 'bg-[#f5f5f5] text-[#666]',
                )}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-11 w-full rounded-lg bg-[#0C831F] text-[14px] font-bold text-white hover:bg-[#097019] disabled:opacity-60"
        >
          {saving ? t('settings.saving') : t('settings.save')}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDelete}
        className="mt-8 inline-flex items-center gap-2 text-[13px] font-semibold text-red-600 hover:underline"
      >
        <Trash2 className="h-4 w-4" />
        {t('settings.delete')}
      </button>
    </div>
  );
}
