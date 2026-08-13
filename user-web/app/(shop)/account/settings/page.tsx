'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { contentService, type PrivacyPolicyContent } from '@/services/content.service';
import { getApiErrorMessage } from '@/lib/auth';
import { EditProfileModal } from '@/components/account/EditProfileModal';
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

  return (
    <>
      <div className="mx-auto w-full max-w-[640px] lg:max-w-none">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[22px] font-extrabold leading-snug tracking-tight text-[#1f1f1f] lg:text-[26px]">
            {policy?.title || t('settings.privacyTitle')}
          </h1>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="mt-0.5 hidden h-10 shrink-0 items-center gap-2 rounded-lg border border-[#0C831F] px-3.5 text-[13px] font-bold text-[#0C831F] hover:bg-[#f0faf2] lg:inline-flex"
          >
            <Pencil className="h-4 w-4" />
            {t('settings.editProfile')}
          </button>
        </div>

        <div className="mt-4 lg:mt-5">
          {!expanded ? (
            <p className="text-[14px] leading-[1.65] text-[#6b6b6b]">{policy?.excerpt}</p>
          ) : (
            <div>{policy ? renderSimpleMarkdown(policy.markdown) : null}</div>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[14px] font-bold text-[#0C831F]"
          >
            {expanded ? t('settings.readLess') : t('settings.readMore')}
            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>

        <div className="mt-8 space-y-3 lg:mt-10">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex w-full items-center gap-3.5 rounded-xl border border-[#ececec] bg-white px-3.5 py-3.5 text-left active:bg-[#fafafa] lg:hidden"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4]">
              <Pencil className="h-5 w-5 text-[#333]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-[#1f1f1f]">
                {t('settings.editProfile')}
              </span>
              <span className="mt-0.5 block text-[13px] text-[#8a8a8a]">
                {t('settings.editProfileSub')}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#c2c2c2]" />
          </button>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex w-full items-center gap-3.5 rounded-xl border border-[#ececec] bg-white px-3.5 py-3.5 text-left active:bg-[#fafafa] lg:px-4 lg:py-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4]">
              <Trash2 className="h-5 w-5 text-[#333]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-[#1f1f1f]">
                {t('settings.deleteRequestTitle')}
              </span>
              <span className="mt-0.5 block text-[13px] text-[#8a8a8a]">
                {t('settings.deleteRequestSub')}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#c2c2c2]" />
          </button>
        </div>

        {error && <p className="mt-4 text-[13px] text-red-600">{error}</p>}
      </div>

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
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-xl sm:rounded-2xl sm:p-6">
            <h3 className="text-[18px] font-extrabold text-[#1f1f1f]">
              {t('settings.deleteConfirmTitle')}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#666]">{t('settings.deleteConfirm')}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
                className="h-12 flex-1 rounded-xl border border-[#ddd] text-[14px] font-bold text-[#666]"
              >
                {t('settings.cancel')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="h-12 flex-1 rounded-xl bg-red-600 text-[14px] font-bold text-white disabled:opacity-60"
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
