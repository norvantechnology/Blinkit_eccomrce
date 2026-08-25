'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { getApiErrorMessage, setStoredUser } from '@/lib/auth';
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const merged = await usersService.updateMe({
        name: name.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      });

      setUser(merged);
      setStoredUser(merged);
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(getApiErrorMessage(err, t('settings.saveFailed')));
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

      <section className="bk-profile-edit__section bk-profile-edit__section--fields">
        <div className="bk-profile-edit__field">
          <label className="bk-profile-edit__label" htmlFor="profile-name">
            {t('settings.name')}
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="bk-profile-edit__input"
          />
        </div>
        <div className="bk-profile-edit__field">
          <label className="bk-profile-edit__label" htmlFor="profile-email">
            {t('settings.email')}
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder={t('settings.emailPlaceholder')}
            className="bk-profile-edit__input"
          />
        </div>
      </section>

      <div className="bk-profile-edit__save-wrap">
        <button type="submit" disabled={saving} className="bk-profile-edit__save">
          {saving ? t('settings.saving') : t('settings.save')}
        </button>
      </div>
    </form>
  );
}
