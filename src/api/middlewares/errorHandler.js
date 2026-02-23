'use strict';

const { AppError } = require('../../utils/errors');
const { error } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Centralized error handling middleware.
 *
 * Must be registered LAST in the Express middleware chain.
 * Distinguishes operational errors (AppError) from unexpected crashes.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Operational errors: safe to expose details to the client
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational server error', {
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
        stack: err.stack,
      });
    } else {
      logger.warn('Client error', {
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
      });
    }

    return error(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle Knex/PostgreSQL unique constraint violations
  if (err.code === '23505') {
    return error(res, 'A record with this value already exists', 409, 'CONFLICT');
  }

  // Handle Knex/PostgreSQL foreign key violations
  if (err.code === '23503') {
    return error(res, 'Referenced resource does not exist', 400, 'FOREIGN_KEY_VIOLATION');
  }

  // Unexpected errors: log full stack, return generic message
  logger.error('Unexpected error', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  return error(
    res,
    'An unexpected error occurred. Please try again later.',
    500,
    'INTERNAL_SERVER_ERROR'
  );
};

module.exports = errorHandler;
