'use client';

import { useI18n } from '@/lib/i18n/useI18n';

export default function WalletPage() {
  const { t } = useI18n();
  return (
    <div className="ua-empty">
      <p>{t('account.wallet')}</p>
      <p style={{ marginTop: 8, fontSize: 13 }}>{t('account.walletEmpty')}</p>
    </div>
  );
}
