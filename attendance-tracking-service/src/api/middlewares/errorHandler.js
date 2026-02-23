'use strict';

const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const env = require('../../config/env');

/**
 * Formats Joi validation errors into a consistent structure.
 */
function formatJoiError(err) {
  const errors = err.details.map((d) => d.message.replace(/['"]/g, ''));
  return AppError.badRequest('Validation failed', errors);
}

/**
 * Formats Knex/PostgreSQL database errors into user-friendly messages.
 */
function formatDbError(err) {
  // Unique constraint violation
  if (err.code === '23505') {
    const detail = err.detail || '';
    const match = detail.match(/\(([^)]+)\)=\(([^)]+)\)/);
    const field = match ? match[1] : 'field';
    return AppError.conflict(`Duplicate value for ${field}`);
  }
  // Foreign key constraint violation
  if (err.code === '23503') {
    return AppError.badRequest('Referenced resource does not exist');
  }
  // Not null violation
  if (err.code === '23502') {
    return AppError.badRequest(`Required field '${err.column}' is missing`);
  }
  return null;
}

/**
 * Central Express error-handling middleware.
 * Must have 4 parameters to be recognized by Express as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Handle Joi validation errors
  if (err.isJoi || err.name === 'ValidationError') {
    error = formatJoiError(err);
  }

  // Handle database errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('2')) {
    const dbError = formatDbError(err);
    if (dbError) error = dbError;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = AppError.unauthorized('Invalid or malformed token');
  }
  if (err.name === 'TokenExpiredError') {
    error = AppError.unauthorized('Token has expired');
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  // Log non-operational errors as errors (programmer mistakes)
  if (!isOperational || statusCode >= 500) {
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  const response = {
    success: false,
    message: isOperational ? error.message : 'An unexpected error occurred',
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
  };

  // Include stack trace in development for debugging
  if (env.app.isDev && !isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
