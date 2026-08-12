'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  uploadFileDirect,
  type UploadFolder,
  type UploadedFile,
} from '@/services/uploads.service';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  folder?: UploadFolder;
  accept?: string;
  value?: string | null;
  onUploaded?: (file: UploadedFile) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
}

export function FileUpload({
  folder = 'misc',
  accept = 'image/jpeg,image/png,image/webp,image/gif,application/pdf',
  value,
  onUploaded,
  onClear,
  className,
  label = 'Upload file',
}: FileUploadProps) {
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
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />

      {preview ? (
        <div className="relative inline-block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded" className="h-36 w-36 object-cover" />
          <button
            type="button"
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"
            onClick={() => {
              setPreview(null);
              onClear?.();
            }}
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          loading={loading}
          leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          onClick={() => inputRef.current?.click()}
        >
          {label}
        </Button>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
