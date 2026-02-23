const { AppError } = require('./errorHandler');

/**
 * Joi schema validation middleware factory.
 *
 * @param {Object} schema - Object with optional keys: body, query, params
 * @returns Express middleware that validates and sanitises the request.
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const key of ['body', 'query', 'params']) {
    if (schema[key]) {
      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        errors.push(...error.details.map((d) => ({
          field: `${key}.${d.path.join('.')}`,
          message: d.message.replace(/['"]/g, ''),
        })));
      } else {
        req[key] = value; // Replace with sanitised/coerced value
      }
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 422, errors));
  }

  return next();
};

module.exports = validate;
