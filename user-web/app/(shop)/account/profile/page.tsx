'use client';

import { EditProfileForm } from '@/components/account/EditProfileForm';
import { useI18n } from '@/lib/i18n/useI18n';

export default function EditProfilePage() {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="text-[22px] font-extrabold leading-tight text-[#1f1f1f] lg:text-[24px]">
        {t('settings.editProfile')}
      </h1>
      <p className="mt-1.5 mb-6 text-[13px] text-[#8a8a8a]">{t('settings.editProfileSub')}</p>
      <EditProfileForm />
    </div>
  );
}
