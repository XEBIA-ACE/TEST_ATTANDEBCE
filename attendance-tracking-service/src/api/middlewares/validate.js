'use strict';

const AppError = require('../../utils/AppError');

/**
 * Validation middleware factory using Joi schemas.
 * Validates req.body, req.params, or req.query against the provided schema.
 *
 * @param {object} schema - Joi schema object.
 * @param {string} [target='body'] - Which part of req to validate: 'body', 'params', 'query'.
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,    // Collect all errors, not just first
      stripUnknown: true,   // Remove unknown fields
      convert: true,        // Type coercion (e.g., '1' -> 1)
    });

    if (error) {
      const errors = error.details.map((d) => d.message.replace(/['"]/g, ''));
      return next(AppError.badRequest('Validation failed', errors));
    }

    // Replace req[target] with sanitized/coerced value
    req[target] = value;
    next();
  };
}

module.exports = validate;
