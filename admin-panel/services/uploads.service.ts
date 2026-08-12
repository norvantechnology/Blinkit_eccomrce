import apiClient from '@/lib/api-client';

export type UploadFolder =
  | 'products'
  | 'banners'
  | 'avatars'
  | 'documents'
  | 'reviews'
  | 'misc';

export interface UploadedFile {
  key: string;
  url: string;
  contentType: string;
  size: number | null;
  originalName: string | null;
  stub: boolean;
}

export interface PresignUpload {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  headers: { 'Content-Type': string };
  expiresIn: number;
  method: 'PUT';
  stub: boolean;
}

/** Multipart upload through backend → S3 */
export async function uploadFile(
  file: File,
  folder: UploadFolder = 'misc',
  basePath: '/uploads' | '/admin/uploads' = '/admin/uploads',
): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const { data } = await apiClient.post(`${basePath}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.file as UploadedFile;
}

/** Browser direct-to-S3 via presigned PUT */
export async function uploadFileDirect(
  file: File,
  folder: UploadFolder = 'misc',
  basePath: '/uploads' | '/admin/uploads' = '/admin/uploads',
): Promise<UploadedFile> {
  const { data } = await apiClient.post(`${basePath}/presign`, {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    folder,
  });
  const upload = data.data.upload as PresignUpload;

  const putRes = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: upload.headers,
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`S3 upload failed (${putRes.status})`);
  }

  return {
    key: upload.key,
    url: upload.publicUrl,
    contentType: file.type,
    size: file.size,
    originalName: file.name,
    stub: upload.stub,
  };
}

export async function deleteUploadedFile(
  key: string,
  basePath: '/uploads' | '/admin/uploads' = '/admin/uploads',
): Promise<void> {
  await apiClient.delete(`${basePath}`, { data: { key } });
}

export const uploadsService = {
  uploadFile,
  uploadFileDirect,
  deleteUploadedFile,
};
