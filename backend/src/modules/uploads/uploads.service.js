const storage = require('../../config/storage');
const { AppError } = require('../../utils/errors');
const { ALLOWED_MIME } = require('./uploads.validator');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const assertMime = (contentType) => {
  if (!ALLOWED_MIME.includes(contentType)) {
    throw new AppError(
      `Unsupported file type. Allowed: ${ALLOWED_MIME.join(', ')}`,
      400,
    );
  }
};

const toFilePayload = ({ key, url, contentType, size, originalName, stub }) => ({
  key,
  url,
  contentType,
  size: size ?? null,
  originalName: originalName ?? null,
  stub: Boolean(stub),
});

const uploadBuffer = async ({
  buffer,
  contentType,
  originalName,
  folder = 'misc',
}) => {
  assertMime(contentType);
  if (!buffer?.length) throw new AppError('Empty file', 400);
  if (buffer.length > MAX_BYTES) {
    throw new AppError('File too large (max 10MB)', 400);
  }

  const key = storage.buildObjectKey(folder, originalName || 'file');
  const result = await storage.upload(key, buffer, contentType);

  return toFilePayload({
    key: result.key,
    url: result.url,
    contentType,
    size: buffer.length,
    originalName,
    stub: result.stub,
  });
};

const createPresign = async ({ fileName, contentType, folder = 'misc' }) => {
  assertMime(contentType);
  const key = storage.buildObjectKey(folder, fileName);
  const { uploadUrl, stub } = await storage.getUploadSignedUrl(key, contentType, 900);

  return {
    key,
    uploadUrl,
    publicUrl: storage.getPublicUrl(key),
    headers: { 'Content-Type': contentType },
    expiresIn: 900,
    method: 'PUT',
    stub: Boolean(stub),
  };
};

const removeObject = async (key) => {
  if (!String(key).startsWith('uploads/')) {
    throw new AppError('Invalid object key', 400);
  }
  await storage.delete(key);
  return { deleted: true, key };
};

module.exports = {
  MAX_BYTES,
  uploadBuffer,
  createPresign,
  removeObject,
  toFilePayload,
};
