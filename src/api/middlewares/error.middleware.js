const { AppError } = require('../../utils/errors');
const { sendError } = require('../../utils/response');
const logger = require('../../config/logger.config');

/**
 * Catch-all Express error handler.
 * Must be registered AFTER all routes with exactly 4 parameters.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Log the error with context
  const meta = {
    method: req.method,
    path: req.path,
    statusCode: err.statusCode,
    errorCode: err.code,
    ...(err.isOperational ? {} : { stack: err.stack }),
  };

  if (err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, meta);
  } else {
    logger.error(`Unexpected error: ${err.message}`, { ...meta, stack: err.stack });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return sendError(res, {
      statusCode: 409,
      message: 'A record with that value already exists',
      code: 'CONFLICT',
    });
  }

  // Sequelize validation
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return sendError(res, {
      statusCode: 422,
      message: 'Database validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // Unknown / programmer errors — hide internals in production
  return sendError(res, {
    statusCode: 500,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    code: 'INTERNAL_ERROR',
  });
}

module.exports = errorHandler;
