'use client';

import { FormEvent, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, setStoredUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
];

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [languagePref, setLanguagePref] = useState(user?.languagePref || 'en');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      });
      const updatedLang = await usersService.updateLanguage(languagePref);
      const merged = { ...updatedProfile, ...updatedLang };
      setUser(merged);
      setStoredUser(merged);
      setMessage('Saved');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
    try {
      await authService.deleteAccount();
      logout();
      router.push('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete account'));
    }
  };

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[#1f1f1f] sm:text-[24px]">Account privacy</h1>
      <p className="mt-1 text-[13px] text-[#888]">Manage your profile and preferences.</p>

      <form onSubmit={handleSave} className="mt-6 max-w-md space-y-4">
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        {message && <p className="text-[13px] text-emerald-700">{message}</p>}

        <div>
          <label htmlFor="privacy-name" className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">
            Name
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
            Email
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
          <p className="mb-2 text-[13px] font-semibold text-[#1f1f1f]">Language</p>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => (
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
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-11 w-full rounded-lg bg-[#0C831F] text-[14px] font-bold text-white hover:bg-[#097019] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDelete}
        className="mt-8 inline-flex items-center gap-2 text-[13px] font-semibold text-red-600 hover:underline"
      >
        <Trash2 className="h-4 w-4" />
        Delete account
      </button>
    </div>
  );
}
