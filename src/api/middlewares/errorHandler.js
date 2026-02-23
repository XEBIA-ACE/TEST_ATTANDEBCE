const logger = require('../../config/logger');

/**
 * Centralised error handler middleware.
 * Converts all errors into consistent JSON responses and logs appropriately.
 * Must be registered as the last middleware in Express.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isOperational = statusCode < 500;

  if (isOperational) {
    logger.warn('Operational error', {
      statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error('Unexpected error', {
      statusCode,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Mask internal details in production
  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
}

module.exports = errorHandler;
