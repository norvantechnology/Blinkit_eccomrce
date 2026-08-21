'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { storeSettingsService } from '@/services/store-settings.service';

export default function AccountPrivacyAdminPage() {
  const [locale, setLocale] = useState<'en' | 'hi'>('en');
  const [markdownEn, setMarkdownEn] = useState('');
  const [markdownHi, setMarkdownHi] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storeSettingsService.getPrivacyPolicy();
      setMarkdownEn(data.en.markdown);
      setMarkdownHi(data.hi.markdown);
    } catch {
      setError('Could not load privacy policy');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const md = locale === 'en' ? markdownEn : markdownHi;
      await storeSettingsService.updatePrivacyPolicy(locale, md);
      setMessage('Saved — live on user Account privacy page');
      await load();
    } catch {
      setError('Could not save');
    } finally {
      setSaving(false);
    }
  };

  const markdown = locale === 'en' ? markdownEn : markdownHi;
  const setMarkdown = locale === 'en' ? setMarkdownEn : setMarkdownHi;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f]">Account privacy policy</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Edit Markdown shown on the user web <strong>Account privacy</strong> page. Use blank lines
          between paragraphs. Wrap emphasis in <code>**double asterisks**</code>.
        </p>
      </div>

      <div className="flex gap-2">
        {(['en', 'hi'] as const).map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            className={`h-9 rounded-lg px-4 text-sm font-semibold ${
              locale === loc ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-muted)] text-[#666]'
            }`}
          >
            {loc === 'en' ? 'English' : 'Hindi'}
          </button>
        ))}
      </div>

      <Card className="space-y-4" padding="md">
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : (
          <>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={18}
              className="w-full rounded-lg border border-[var(--border)] bg-white p-3 font-mono text-sm leading-relaxed text-[#333] outline-none focus:border-[var(--primary)]"
              placeholder="We i.e. **Tapi Grocery**, are committed to..."
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              Tip: First paragraph becomes the collapsed excerpt on the user site.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="h-10 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : `Save ${locale === 'en' ? 'English' : 'Hindi'} policy`}
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
