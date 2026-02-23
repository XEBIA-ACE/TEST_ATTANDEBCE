'use strict';

/**
 * AppError is the base class for all operational errors.
 * Operational errors (e.g., 404, 400) are expected and handled gracefully.
 * Programming errors (bugs) should bubble up to the global error handler.
 */
class AppError extends Error {
  /**
   * @param {string}  message    - Human-readable error description
   * @param {number}  statusCode - HTTP status code
   * @param {Array}   [errors]   - Detailed validation or field errors
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static internal(message = 'Internal Server Error') {
    return new AppError(message, 500);
  }
}

module.exports = AppError;
