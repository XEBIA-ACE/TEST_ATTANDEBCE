'use strict';

const { validationResult } = require('express-validator');
const { ValidationError } = require('../../utils/errors');

/**
 * Validation middleware runner.
 *
 * Collects all validation errors from express-validator chains
 * and throws a structured ValidationError if any exist.
 *
 * Usage (in routes):
 *   router.post('/', [...validationChains], validate, controllerFn)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    return next(new ValidationError('Request validation failed', details));
  }

  next();
};

module.exports = validate;
