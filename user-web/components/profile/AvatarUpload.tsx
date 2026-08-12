'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import {
  uploadFileDirect,
  type UploadFolder,
  type UploadedFile,
} from '@/services/uploads.service';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const uploaded = await uploadFileDirect(file, folder);
      setPreview(uploaded.url);
      onUploaded?.(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />

      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[#f0f0f0]">
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
          Change photo
        </button>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
