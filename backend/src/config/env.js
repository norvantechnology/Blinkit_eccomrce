require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Warning: ${key} is not set`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  defaultStoreId: process.env.DEFAULT_STORE_ID,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  opensearchEndpoint: process.env.OPENSEARCH_ENDPOINT,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    adminAccessExpiry: process.env.JWT_ADMIN_ACCESS_EXPIRY || '8h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.S3_BUCKET,
    cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN,
    sesFromEmail: process.env.SES_FROM_EMAIL,
    snsSenderId: process.env.SNS_SENDER_ID,
    secretsManagerSecretName: process.env.SECRETS_MANAGER_SECRET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '5', 10),
  paymentGateway: {
    key: process.env.PAYMENT_GATEWAY_KEY,
    secret: process.env.PAYMENT_GATEWAY_SECRET,
  },
  mapsApiKey: process.env.MAPS_API_KEY,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  whatsappApiKey: process.env.WHATSAPP_API_KEY,
  apiBaseUrl: process.env.API_BASE_URL || '',
  seed: {
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'admin@gmail.com',
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || 'admin@123',
    superAdminName: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  },
};
