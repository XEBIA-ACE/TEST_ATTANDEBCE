'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../config');
const { UnauthorizedError, ForbiddenError } = require('../../utils/errors');

/**
 * JWT authentication middleware.
 *
 * Reads the Bearer token from the Authorization header, verifies it, and
 * attaches the decoded payload to `req.user`.
 *
 * Usage:
 *   router.get('/protected', authenticate, handler)
 *   router.delete('/admin-only', authenticate, authorize(['admin']), handler)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    return next();
  } catch (err) {
    return next(err); // JsonWebTokenError / TokenExpiredError → handled by errorHandler
  }
}

/**
 * Role-based authorisation middleware factory.
 * Must be used AFTER `authenticate`.
 *
 * @param {string[]} roles  - Allowed roles (e.g. ['admin', 'manager'])
 */
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
