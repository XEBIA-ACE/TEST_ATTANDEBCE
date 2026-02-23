'use strict';

const jwt = require('jsonwebtoken');
const appConfig = require('../../config/app.config');
const AppError = require('../../utils/app.error');

/**
 * authenticate – verifies the Bearer JWT in the Authorization header.
 *
 * On success it attaches `req.user = { id, employeeCode, email, role }`.
 * This is a placeholder implementation; swap with your identity provider as needed.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, appConfig.jwt.secret);
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Token has expired'));
    }
    return next(AppError.unauthorized('Invalid token'));
  }
}

/**
 * authorize – restricts access to users with specific roles.
 *
 * @param {...string} roles  - Allowed roles (e.g., 'admin', 'manager')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
