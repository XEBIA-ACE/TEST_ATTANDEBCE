'use strict';

const Joi = require('joi');
const { ValidationError } = require('../../utils/errors');

/**
 * Generic Joi validation middleware factory.
 * Validates `req.body`, `req.query`, or `req.params` against the provided schema.
 *
 * @param {Joi.Schema} schema  - Joi schema to validate against
 * @param {'body'|'query'|'params'} target  - Which part of the request to validate
 *
 * @example
 *   router.post('/employees', validate(createEmployeeSchema), controller.create)
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,   // collect ALL errors, not just the first
      stripUnknown: true,  // silently drop fields not in the schema
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return next(new ValidationError('Validation failed', details));
    }

    // Replace the original object with the stripped/coerced value
    req[target] = value;
    return next();
  };
}

module.exports = validate;
