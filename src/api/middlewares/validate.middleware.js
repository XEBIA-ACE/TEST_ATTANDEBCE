const { ValidationError } = require('../../utils/errors');

/**
 * Factory that returns an Express middleware validating `req[source]`
 * against a Joi schema.
 *
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} source - Which request property to validate
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,    // collect all errors, not just the first
      stripUnknown: true,   // drop unrecognised keys
      convert: true,        // allow type coercion (string '1' → number 1)
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }

    // Replace the raw input with the validated + coerced value
    req[source] = value;
    return next();
  };
}

module.exports = validate;
