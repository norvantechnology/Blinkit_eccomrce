require('dotenv').config();
const { loadSecrets } = require('./config/loadSecrets');

const start = async () => {
  await loadSecrets();

  // Sync schema gaps (email OTP) before serving traffic
  const { ensureEmailAuthSchema } = require('./database/prisma/ensureEmailAuthSchema');
  await ensureEmailAuthSchema();

  // Require after secrets so env.js / clients see populated process.env
  const app = require('./app');
  const env = require('./config/env');
  const logger = require('./utils/logger');
  const redis = require('./config/redis');
  const { startAuditLogPurgeJob } = require('./middlewares/auditLogger');

  try {
    await redis.connect();
  } catch (err) {
    logger.error('Failed to connect to Redis', { error: err.message });
    process.exit(1);
  }

  startAuditLogPurgeJob();

  const server = app.listen(env.port, () => {
    logger.info(`Tapi Grocery API running on port ${env.port}`, {
      env: env.nodeEnv,
      s3Configured: Boolean(env.aws.s3Bucket),
    });
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
      await redis.quit();
      process.exit(0);
    });
  });
};

start().catch((err) => {
  console.error('[boot] Failed:', err.message);
  process.exit(1);
});
