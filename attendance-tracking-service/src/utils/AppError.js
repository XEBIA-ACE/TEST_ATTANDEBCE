'use strict';

/**
 * Custom application error class with HTTP status code support.
 * Distinguishes operational errors (expected) from programmer errors (bugs).
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {number} statusCode - HTTP status code (default: 500).
   * @param {Array<string>} [errors] - Additional validation error details.
   */
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Marks as a known, handled error
    Error.captureStackTrace(this, this.constructor);
  }

  // Convenience factory methods for common HTTP error types

  static badRequest(message, errors = []) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static unprocessable(message, errors = []) {
    return new AppError(message, 422, errors);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500);
  }
}

module.exports = AppError;
