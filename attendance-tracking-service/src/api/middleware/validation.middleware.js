/**
 * Factory function that returns an Express middleware for validating
 * req.body, req.query, or req.params against a Joi schema.
 *
 * @param {import('joi').Schema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   // Collect all errors, not just the first
      stripUnknown: true,  // Remove unknown fields silently
      convert: true,       // Coerce types (e.g., "123" → 123)
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
          })),
        },
      });
    }

    // Replace the request property with the validated & coerced value
    req[source] = value;
    return next();
  };
}

module.exports = { validate };
