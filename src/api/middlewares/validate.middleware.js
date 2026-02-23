'use strict';

const AppError = require('../../utils/app.error');

/**
 * Returns an Express middleware that validates the request using the given Joi schema.
 *
 * @param {import('joi').Schema} schema  - Joi schema to validate against
 * @param {'body'|'query'|'params'} [source='body']  - Which part of the request to validate
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   // collect all errors, not just the first
      stripUnknown: true,  // remove unrecognised fields
      convert: true,       // coerce types (e.g. string '1' → number 1)
    });

    if (error) {
      const messages = error.details.map((d) => d.message.replace(/"/g, "'"));
      return next(AppError.badRequest('Validation failed', messages));
    }

    // Replace the source with the cleaned/coerced value
    req[source] = value;
    return next();
  };
}

module.exports = validate;
