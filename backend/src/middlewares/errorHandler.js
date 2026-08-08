const logger = require('../utils/logger');
const { Prisma } = require('@prisma/client');

const errorHandler = (err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed. Check DATABASE_URL and ensure PostgreSQL is running.';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P1001' || err.code === 'P1000') {
      statusCode = 503;
      message = 'Database connection failed. Check DATABASE_URL and ensure PostgreSQL is running.';
    }
  } else if (message.includes('Authentication failed against database server')) {
    statusCode = 503;
    message = 'Database authentication failed. Check DATABASE_URL credentials.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { detail: err.message }),
  });
};

module.exports = errorHandler;
