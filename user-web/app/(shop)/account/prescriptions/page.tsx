'use client';

import { useI18n } from '@/lib/i18n/useI18n';

export default function PrescriptionsPage() {
  const { t } = useI18n();
  return (
    <div className="ua-empty">
      <p>{t('account.prescriptions')}</p>
      <p style={{ marginTop: 8, fontSize: 13 }}>{t('account.prescriptionsEmpty')}</p>
    </div>
  );
}
