'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, setStoredUser } from '@/lib/auth';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { useI18n } from '@/lib/i18n/useI18n';

type Props = {
  onSaved?: () => void;
};

export function EditProfileForm({ onSaved }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setAvatarUrl(user.avatarUrl || null);
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      if (password.trim().length > 0 && password.trim().length < 6) {
        throw new Error(t('settings.passwordTooShort'));
      }

      let merged = await usersService.updateMe({
        name: name.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        avatarUrl,
      });

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
        err instanceof Error && err.message === t('settings.passwordTooShort')
          ? err.message
          : getApiErrorMessage(err, t('settings.saveFailed')),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bk-profile-edit__form">
      {error ? <p className="bk-profile-edit__msg bk-profile-edit__msg--error">{error}</p> : null}
      {saved && !error ? (
        <p className="bk-profile-edit__msg bk-profile-edit__msg--ok">{t('settings.saved')}</p>
      ) : null}

      <section className="bk-profile-edit__section">
        <p className="bk-profile-edit__section-title">{t('settings.photo')}</p>
        <AvatarUpload
          value={avatarUrl}
          onUploaded={(file) => setAvatarUrl(file.url)}
          onClear={() => setAvatarUrl(null)}
        />
      </section>

      <section className="bk-profile-edit__section">
        <div className="bk-profile-edit__field">
          <label className="bk-profile-edit__label">{t('settings.name')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="bk-profile-edit__input"
          />
        </div>
        <div className="bk-profile-edit__field">
          <label className="bk-profile-edit__label">{t('settings.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder={t('settings.emailPlaceholder')}
            className="bk-profile-edit__input"
          />
        </div>
      </section>

      <section className="bk-profile-edit__section">
        <label className="bk-profile-edit__label">{t('settings.password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="••••••••"
          className="bk-profile-edit__input"
        />
        <p className="bk-profile-edit__hint">{t('settings.passwordHint')}</p>
      </section>

      <div className="bk-profile-edit__save-wrap">
        <button type="submit" disabled={saving} className="bk-profile-edit__save">
          {saving ? t('settings.saving') : t('settings.save')}
        </button>
      </div>
    </form>
  );
}
