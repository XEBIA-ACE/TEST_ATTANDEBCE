'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const { UnauthorizedError, ForbiddenError } = require('../../utils/errors');

/**
 * JWT authentication middleware.
 *
 * Validates the Authorization: Bearer <token> header.
 * Attaches decoded payload to req.user for downstream handlers.
 *
 * NOTE: This is a placeholder implementation. Integrate with your
 * identity provider (OAuth2, LDAP, etc.) in production.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }
};

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin') or authorize(['admin', 'manager'])
 */
const authorize = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Role '${req.user.role}' is not permitted to perform this action`)
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
