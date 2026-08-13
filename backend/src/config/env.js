/**
 * Env after Secrets Manager bootstrap (see server.js → loadSecrets).
 * Sensitive values never hardcoded — only from process.env (populated by SM).
 */
const { JWT_EXPIRY, AUDIT_RETENTION_DAYS, SECRETS_MANAGER } = require('./constants');

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Warning: ${key} is not set (load Secrets Manager first)`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  defaultStoreId: process.env.DEFAULT_STORE_ID,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: JWT_EXPIRY.ACCESS,
    adminAccessExpiry: JWT_EXPIRY.ADMIN_ACCESS,
    refreshExpiry: JWT_EXPIRY.REFRESH,
  },
  aws: {
    region: process.env.AWS_REGION || SECRETS_MANAGER.REGION,
    s3Bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    secretsManagerSecretName: SECRETS_MANAGER.SECRET_NAME,
    cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN || '',
    sesFromEmail: process.env.SES_FROM_EMAIL || '',
  },
  auditRetentionDays: AUDIT_RETENTION_DAYS,
  mapsApiKey: process.env.MAPS_API_KEY || '',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  apple: {
    /** Services ID (e.g. com.tapigrocery.web) — audience for Apple identity tokens */
    clientId: process.env.APPLE_CLIENT_ID || '',
  },
  apiBaseUrl: process.env.API_BASE_URL || '',
  adminPanelUrl: process.env.ADMIN_PANEL_URL || 'http://localhost:3000',
};
