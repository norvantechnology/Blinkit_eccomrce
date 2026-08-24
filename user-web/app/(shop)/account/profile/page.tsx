'use client';

import { EditProfileForm } from '@/components/account/EditProfileForm';
import { useI18n } from '@/lib/i18n/useI18n';
import '@/styles/blinkit-edit-profile.css';

export default function EditProfilePage() {
  const { t } = useI18n();

  return (
    <div className="bk-profile-edit">
      <header className="bk-profile-edit__head">
        <h1 className="bk-profile-edit__title">{t('settings.editProfile')}</h1>
        <p className="bk-profile-edit__sub">{t('settings.editProfileSub')}</p>
      </header>
      <EditProfileForm />
    </div>
  );
}
