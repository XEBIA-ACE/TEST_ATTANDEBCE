'use strict';

const { AppError } = require('../../utils/errors');
const { sendError } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Central error-handling middleware.
 * Must be registered LAST in the Express app (after all routes).
 *
 * Classifies errors into:
 *  - Operational (AppError subclasses) → client-facing, structured response
 *  - Unexpected (everything else)       → generic 500, full stack logged
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Knex/PostgreSQL unique-constraint violation
  if (err.code === '23505') {
    return sendError(res, 'A record with this value already exists', 409, 'CONFLICT');
  }

  // Knex/PostgreSQL foreign-key violation
  if (err.code === '23503') {
    return sendError(res, 'Referenced resource does not exist', 422, 'FOREIGN_KEY_VIOLATION');
  }

  // JWT errors from the auth middleware
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired', 401, 'TOKEN_EXPIRED');
  }

  if (err instanceof AppError) {
    // Log at warn for 4xx (expected), error for 5xx (unexpected domain errors)
    const logFn = err.statusCode >= 500 ? 'error' : 'warn';
    logger[logFn]('Operational error', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    return sendError(res, err.message, err.statusCode, err.code, err.details || undefined);
  }

  // Unknown / programmer error
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return sendError(res, 'An unexpected error occurred', 500, 'INTERNAL_ERROR');
}

module.exports = errorHandler;
