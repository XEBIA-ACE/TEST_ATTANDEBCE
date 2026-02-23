const logger = require('../../config/logger');

/**
 * Custom application error class with HTTP status codes.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles requests for routes that do not exist.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

/**
 * Centralised error handler. Normalises all errors (validation, DB, auth, etc.)
 * into a consistent JSON response shape and logs them appropriately.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Knex / PostgreSQL constraint violations
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with this value already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  // Joi validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    details = err.details?.map((d) => ({ field: d.path.join('.'), message: d.message }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Log server errors with full stack trace
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      body: req.body,
    });
  } else {
    logger.warn('Client error', {
      statusCode,
      message,
      method: req.method,
      url: req.originalUrl,
    });
  }

  const response = { status: 'error', message };
  if (details) response.details = details;

  // Omit internal details from production responses
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { AppError, errorHandler, notFoundHandler };
