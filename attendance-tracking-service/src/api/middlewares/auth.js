'use strict';

const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');

/**
 * JWT authentication middleware.
 * Validates the Bearer token and attaches the decoded payload to req.user.
 *
 * In production, you would verify the user against the database here
 * to ensure the token hasn't been revoked.
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authentication required. Provide a Bearer token.');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;

    next();
  } catch (err) {
    next(err); // Passes JWT errors to errorHandler which translates them
  }
}

/**
 * Role-based authorization middleware factory.
 * @param {...string} roles - Allowed roles.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied. Required roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
}

/**
 * Utility to generate a JWT token (used in auth endpoints).
 * @param {object} payload - Data to encode in the token.
 * @returns {string} Signed JWT token.
 */
function generateToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

module.exports = { authenticate, authorize, generateToken };
