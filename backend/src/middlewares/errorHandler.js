const logger = require('../utils/logger');
const { Prisma } = require('@prisma/client');

const errorHandler = (err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10MB)' : err.message;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed. Check DATABASE_URL and ensure PostgreSQL is running.';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P1001' || err.code === 'P1000') {
      statusCode = 503;
      message = 'Database connection failed. Check DATABASE_URL and ensure PostgreSQL is running.';
    } else if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists';
    } else if (err.code === 'P2003' || err.code === 'P2011') {
      statusCode = 400;
      message = 'Invalid data for this request';
    } else if (err.code === 'P2022') {
      // Column does not exist — schema out of date
      statusCode = 503;
      message = 'Database schema is out of date. Please redeploy the API.';
    }
  } else if (/invalid input value for enum/i.test(message) || /AuthProvider/i.test(message)) {
    statusCode = 503;
    message = 'Database schema is out of date (AuthProvider). Please redeploy the API.';
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
