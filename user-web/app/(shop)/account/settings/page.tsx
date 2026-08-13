'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { contentService, type PrivacyPolicyContent } from '@/services/content.service';
import { getApiErrorMessage } from '@/lib/auth';
import { EditProfileModal } from '@/components/account/EditProfileModal';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { renderSimpleMarkdown } from '@/lib/simple-markdown';
import { useI18n } from '@/lib/i18n/useI18n';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/messages';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t, locale } = useI18n();

  const [policy, setPolicy] = useState<PrivacyPolicyContent | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

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

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await authService.deleteAccount();
      logout();
      router.replace('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete account'));
      setDeleting(false);
    }
  };

  const policyBody = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-[22px] font-extrabold leading-tight text-[#1f1f1f] sm:text-[26px]">
          {policy?.title || t('settings.privacyTitle')}
        </h1>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#0C831F] px-4 text-[13px] font-bold text-[#0C831F] hover:bg-[#f0faf2]"
        >
          <Pencil className="h-4 w-4" />
          {t('settings.editProfile')}
        </button>
      </div>

      <div className="mt-5">
        {!expanded ? (
          <p className="text-[14px] leading-relaxed text-[#666]">{policy?.excerpt}</p>
        ) : (
          <div>{policy ? renderSimpleMarkdown(policy.markdown) : null}</div>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[14px] font-bold text-[#0C831F] hover:underline"
        >
          {expanded ? t('settings.readLess') : t('settings.readMore')}
          <ChevronDown className={cn('h-4 w-4 transition', expanded && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-8 border-t border-[#f0f0f0] pt-6">
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex w-full items-center gap-4 rounded-xl border border-[#e8e8e8] bg-white px-4 py-4 text-left transition hover:border-[#ddd] hover:bg-[#fafafa]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5]">
            <Trash2 className="h-5 w-5 text-[#555]" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-[#1f1f1f]">
              {t('settings.deleteRequestTitle')}
            </span>
            <span className="mt-0.5 block text-[13px] text-[#888]">{t('settings.deleteRequestSub')}</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#999]" />
        </button>
      </div>

      {error && <p className="mt-4 text-[13px] text-red-600">{error}</p>}
    </>
  );

  return (
    <>
      {/* Mobile: sidebar strip + content */}
      <div className="lg:hidden">
        <Link href="/account" className="mb-4 inline-block text-[13px] font-semibold text-[#0C831F]">
          ← {t('account.hub')}
        </Link>
        <div className="mb-6 overflow-hidden rounded-xl border border-[#e8e8e8] bg-white">
          <AccountSidebar />
        </div>
        {policyBody}
      </div>

      {/* Desktop: content only (sidebar in layout) */}
      <div className="hidden lg:block">{policyBody}</div>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => void loadPolicy()}
      />

      {deleteOpen && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => !deleting && setDeleteOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <h3 className="text-[18px] font-extrabold text-[#1f1f1f]">{t('settings.deleteConfirmTitle')}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#666]">{t('settings.deleteConfirm')}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
                className="h-11 flex-1 rounded-lg border border-[#ddd] text-[14px] font-bold text-[#666]"
              >
                {t('settings.cancel')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="h-11 flex-1 rounded-lg bg-red-600 text-[14px] font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? t('settings.deleting') : t('settings.deleteConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
