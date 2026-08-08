const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('[redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log(`[redis] Connected to ${env.redisUrl}`);
});

module.exports = redis;
