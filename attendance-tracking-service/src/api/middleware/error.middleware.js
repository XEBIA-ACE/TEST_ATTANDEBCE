'use strict';

const logger = require('../../config/logger');

/**
 * Centralised error-handling middleware.
 * Must be registered LAST in the Express middleware chain.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Joi validation errors come with a details array
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: err.details
        ? err.details.map((d) => ({ field: d.path.join('.'), message: d.message }))
        : [{ message: err.message }],
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
    });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with the provided data already exists',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist',
    });
  }

  // Application-level known errors (set statusCode in service layer)
  const status = err.statusCode || err.status || 500;

  if (status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message,
    });
  }

  // Unexpected server errors — log full details, hide from client
  logger.error('Unhandled server error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    requestId: req.id,
  });

  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
  });
}

/**
 * 404 handler — place before errorHandler but after all routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

module.exports = { errorHandler, notFoundHandler };
