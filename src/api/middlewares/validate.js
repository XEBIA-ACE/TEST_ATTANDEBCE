/**
 * Joi schema validation middleware factory.
 * Validates req.body, req.params, or req.query against a Joi schema.
 *
 * @param {object} schema - Joi schema object with optional body/params/query keys
 */
function validate(schema) {
  return (req, res, next) => {
    const targets = { body: req.body, params: req.params, query: req.query };
    const errors = [];

    for (const [key, joiSchema] of Object.entries(schema)) {
      if (!joiSchema) continue;
      const { error } = joiSchema.validate(targets[key], { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message.replace(/['"]/g, ''),
          }))
        );
      }
    }

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
}

module.exports = validate;
