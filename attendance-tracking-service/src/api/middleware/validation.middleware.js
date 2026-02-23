'use strict';

/**
 * Middleware factory that validates a request section against a Joi schema.
 *
 * @param {import('joi').Schema} schema  - Joi schema to validate against
 * @param {'body'|'query'|'params'}  source - Which part of req to validate
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,       // collect all errors, not just the first
      stripUnknown: true,      // remove fields not defined in schema
      convert: true,           // coerce types (e.g. string -> number)
    });

    if (error) {
      return res.status(422).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/"/g, ''),
        })),
      });
    }

    // Replace request source with the validated (and coerced) value
    req[source] = value;
    return next();
  };
}

module.exports = { validate };
