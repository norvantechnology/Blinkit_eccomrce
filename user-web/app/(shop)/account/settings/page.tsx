'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { contentService, type PrivacyPolicyContent } from '@/services/content.service';
import { renderSimpleMarkdown } from '@/lib/simple-markdown';
import { useI18n } from '@/lib/i18n/useI18n';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/messages';
import '@/styles/blinkit-delete-account.css';

export default function PrivacyPage() {
  const user = useAuthStore((s) => s.user);
  const { t, locale } = useI18n();
  const [policy, setPolicy] = useState<PrivacyPolicyContent | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadPolicy = useCallback(async () => {
    try {
      const data = await contentService.getPrivacyPolicy(locale as Locale);
      setPolicy(data);
    } catch {
      setPolicy({
        locale,
        title: t('settings.privacyTitle'),
        excerpt: t('settings.privacyFallback'),
        markdown: t('settings.privacyFallback'),
      });
    }
  }, [locale, t]);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  if (!user) return null;

  return (
    <div className="bk-privacy">
      <div className="bk-privacy__copy">
        <h1 className="bk-privacy__title">{policy?.title || t('settings.privacyTitle')}</h1>

        {!expanded ? (
          <p className="bk-privacy__body">{policy?.excerpt || t('settings.privacyFallback')}</p>
        ) : (
          <div className="bk-privacy__body">
            {policy ? renderSimpleMarkdown(policy.markdown) : null}
          </div>
        )}

        <button type="button" className="bk-privacy__more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t('settings.readLess') : t('settings.readMore')}
          <span className={cn('bk-privacy__more-caret', expanded && 'is-open')} aria-hidden />
        </button>
      </div>

      <div className="bk-privacy__cards">
        <Link href="/account/profile" className="bk-privacy__card">
          <span className="bk-privacy__card-icon" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/blinkit-parity/icons/location/edit-pencil.svg" alt="" width={14} height={14} />
          </span>
          <span className="bk-privacy__delete-copy">
            <span className="bk-privacy__delete-title">{t('settings.editProfile')}</span>
            <span className="bk-privacy__delete-sub">{t('settings.editProfileSub')}</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="bk-privacy__chev"
            src="/blinkit-parity/icons/account/chevron-right.svg"
            alt=""
            width={14}
            height={14}
          />
        </Link>

        <Link href="/account/privacy/delete" className="bk-privacy__card">
          <span className="bk-privacy__card-icon" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/blinkit-parity/icons/account/trash-outline.svg" alt="" width={14} height={14} />
          </span>
          <span className="bk-privacy__delete-copy">
            <span className="bk-privacy__delete-title">{t('settings.deleteRequestTitle')}</span>
            <span className="bk-privacy__delete-sub">{t('settings.deleteRequestSub')}</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="bk-privacy__chev"
            src="/blinkit-parity/icons/account/chevron-right.svg"
            alt=""
            width={14}
            height={14}
          />
        </Link>
      </div>
    </div>
  );
}
