/**
 * S3 storage client.
 * Uses real AWS S3 when S3_BUCKET (+ credentials) are configured.
 * Falls back to a local stub for development without AWS.
 */
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const env = require('./env');

const isConfigured = Boolean(env.aws.s3Bucket);

let s3Client = null;

const getClient = () => {
  if (!isConfigured) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.aws.region,
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

const storage = {
  isConfigured,

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
