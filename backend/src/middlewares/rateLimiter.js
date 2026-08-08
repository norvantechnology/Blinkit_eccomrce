const redis = require('../config/redis');
const { AppError } = require('../utils/errors');

/**
 * Redis token-bucket style rate limiter.
 * @param {object} options
 * @param {number} options.max - Max requests in window
 * @param {number} options.windowSeconds - Window duration in seconds
 * @param {(req: import('express').Request) => string} options.keyGenerator - Full Redis key
 */
const rateLimiter = ({ max, windowSeconds, keyGenerator }) => {
  return async (req, _res, next) => {
    try {
      const key = keyGenerator(req);
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > max) {
        throw new AppError('Too many requests. Please try again later.', 429);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = rateLimiter;
