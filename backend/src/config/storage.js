/**
 * S3 storage client.
 * Real AWS S3 when S3_BUCKET (+ credentials) are set; stub otherwise.
 */
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');
const path = require('path');
const env = require('./env');

const isConfigured = Boolean(env.aws.s3Bucket);

let s3Client = null;

const getClient = () => {
  if (!isConfigured) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.aws.region,
      // Avoid flexible checksums on presigned browser PUTs
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      ...(env.aws.accessKeyId && env.aws.secretAccessKey
        ? {
            credentials: {
              accessKeyId: env.aws.accessKeyId,
              secretAccessKey: env.aws.secretAccessKey,
            },
          }
        : {}),
    });
  }
  return s3Client;
};

const publicUrl = (key) => {
  if (env.aws.cloudfrontDomain) {
    return `https://${env.aws.cloudfrontDomain.replace(/^https?:\/\//, '')}/${key}`;
  }
  return `https://${env.aws.s3Bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
};

const sanitizeFolder = (folder = 'misc') =>
  String(folder)
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, '')
    .replace(/^\/+|\/+$/g, '')
    .slice(0, 64) || 'misc';

const sanitizeFileName = (name = 'file') => {
  const base = path.basename(String(name)).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.slice(0, 120) || 'file';
};

const buildObjectKey = (folder, fileName) => {
  const safeFolder = sanitizeFolder(folder);
  const safeName = sanitizeFileName(fileName);
  return `uploads/${safeFolder}/${randomUUID()}-${safeName}`;
};

const storage = {
  isConfigured,
  buildObjectKey,
  publicUrl,

  async upload(key, buffer, contentType = 'application/octet-stream') {
    const client = getClient();
    if (!client) {
      console.log(`[storage] Stub upload key=${key} (set S3_BUCKET to enable)`);
      return { key, url: `http://localhost:4000/uploads/${key}`, stub: true };
    }

    await client.send(
      new PutObjectCommand({
        Bucket: env.aws.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return { key, url: publicUrl(key), stub: false };
  },

  async delete(key) {
    const client = getClient();
    if (!client) {
      console.log(`[storage] Stub delete key=${key}`);
      return true;
    }

    await client.send(
      new DeleteObjectCommand({
        Bucket: env.aws.s3Bucket,
        Key: key,
      }),
    );
    return true;
  },

  /** Browser/client PUT upload URL */
  async getUploadSignedUrl(key, contentType, expiresIn = 900) {
    const client = getClient();
    if (!client) {
      return {
        uploadUrl: `http://localhost:4000/api/v1/uploads/stub-put`,
        stub: true,
      };
    }

    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: env.aws.s3Bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn },
    );

    return { uploadUrl, stub: false };
  },

  async getSignedUrl(key, expiresIn = 3600) {
    const client = getClient();
    if (!client) {
      return `http://localhost:4000/uploads/${key}`;
    }

    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: env.aws.s3Bucket, Key: key }),
      { expiresIn },
    );
  },

  getPublicUrl(key) {
    if (!isConfigured) return `http://localhost:4000/uploads/${key}`;
    return publicUrl(key);
  },
};

module.exports = storage;
