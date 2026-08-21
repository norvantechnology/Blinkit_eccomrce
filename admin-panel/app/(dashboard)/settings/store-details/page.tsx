'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { Card } from '@/components/ui/Card';
import type { UploadedFile } from '@/services/uploads.service';

export default function StoreDetailsPage() {
  const [logo, setLogo] = useState<UploadedFile | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f]">Store Details</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Upload store logo and assets to S3. Use the returned URL in product/store APIs.
        </p>
      </div>

      <Card className="space-y-4" padding="md">
        <div>
          <h2 className="text-sm font-semibold">Store logo</h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            JPEG, PNG, WebP, GIF, or PDF — max 10MB
          </p>
        </div>

        <FileUpload
          folder="banners"
          label="Upload logo"
          value={logo?.url}
          onUploaded={setLogo}
          onClear={() => setLogo(null)}
        />

        {logo ? (
          <div className="rounded-lg bg-[var(--surface-muted)] p-3 text-xs text-[#1f1f1f]">
            <p>
              <span className="font-medium">key:</span> {logo.key}
            </p>
            <p className="mt-1 break-all">
              <span className="font-medium">url:</span> {logo.url}
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
