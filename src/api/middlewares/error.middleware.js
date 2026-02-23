'use strict';

const logger = require('../../utils/logger');
const ResponseHelper = require('../../utils/response.helper');
const AppError = require('../../utils/app.error');

/**
 * notFound – catches requests that fall through all routes and creates a 404 error.
 */
function notFound(req, res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
}

/**
 * globalErrorHandler – the Express 4-argument error handler.
 * Distinguishes between operational errors (AppError) and unexpected bugs.
 */
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
  // Sequelize unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    return ResponseHelper.error(res, {
      statusCode: 409,
      message: 'A record with this value already exists',
      errors: err.errors?.map((e) => e.message),
    });
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return ResponseHelper.error(res, {
      statusCode: 422,
      message: 'Database validation failed',
      errors: err.errors?.map((e) => e.message),
    });
  }

  // Known operational errors (AppError instances)
  if (err.isOperational) {
    logger.warn({ message: err.message, statusCode: err.statusCode, path: req.path });
    return ResponseHelper.error(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  // Unknown / programming errors – log the full stack and return a generic message
  logger.error({ message: err.message, stack: err.stack, path: req.path });

  return ResponseHelper.error(res, {
    statusCode: 500,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  });
}

module.exports = { notFound, globalErrorHandler };
