'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import {
  uploadFileDirect,
  type UploadFolder,
  type UploadedFile,
} from '@/services/uploads.service';
import { useI18n } from '@/lib/i18n/useI18n';

interface AvatarUploadProps {
  folder?: UploadFolder;
  value?: string | null;
  onUploaded?: (file: UploadedFile) => void;
  onClear?: () => void;
}

export function AvatarUpload({
  folder = 'avatars',
  value,
  onUploaded,
  onClear,
}: AvatarUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const uploaded = await uploadFileDirect(file, folder);
      setPreview(uploaded.url);
      onUploaded?.(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.uploadFailed'));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="bk-avatar">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />

      <div className="bk-avatar__disc relative h-[72px] w-[72px] overflow-hidden rounded-full bg-[#f0f0f0]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            className="flex h-full w-full items-center justify-center text-[#666]"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            aria-label="Upload avatar"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </button>
        )}
        {preview ? (
          <button
            type="button"
            className="absolute right-0 top-0 rounded-full bg-black/60 p-1 text-white"
            onClick={() => {
              setPreview(null);
              onClear?.();
            }}
            aria-label="Remove avatar"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {preview ? (
        <button
          type="button"
          className="text-xs font-medium text-[#0c831f]"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {t('settings.changePhoto')}
        </button>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
