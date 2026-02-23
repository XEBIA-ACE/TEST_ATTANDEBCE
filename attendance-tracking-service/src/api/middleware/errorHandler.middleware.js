const { AppError } = require('../../utils/errors');
const logger = require('../../utils/logger');

/**
 * Global Express error handler.
 * Converts known AppErrors to structured JSON responses.
 * Hides internal details for unexpected errors in production.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log every error with request context
  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    errorCode: err.errorCode,
    statusCode: err.statusCode,
  };

  if (err.isOperational) {
    logger.warn(err.message, logMeta);
  } else {
    logger.error(err.message, { ...logMeta, stack: err.stack });
  }

  // Joi validation errors from .validate()
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.details.map((d) => d.message),
      },
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    const body = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
      },
    };
    if (err.details) body.error.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // Knex / DB constraint errors
  if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Duplicate entry — a record with the same unique field already exists' },
    });
  }

  // Fallback for unexpected errors
  const message =
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message },
  });
}

module.exports = errorHandler;
