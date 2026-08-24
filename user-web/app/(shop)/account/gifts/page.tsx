'use client';

import { useI18n } from '@/lib/i18n/useI18n';

export default function GiftsPage() {
  const { t } = useI18n();
  return (
    <div className="ua-empty">
      <p>{t('account.gifts')}</p>
      <p style={{ marginTop: 8, fontSize: 13 }}>{t('account.giftsEmpty')}</p>
    </div>
  );
}
