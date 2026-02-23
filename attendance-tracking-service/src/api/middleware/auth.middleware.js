const jwt = require('jsonwebtoken');
const config = require('../../config');
const { UnauthorizedError, ForbiddenError } = require('../../utils/errors');

/**
 * Authentication middleware.
 * Verifies the Bearer JWT token from the Authorization header.
 * Attaches decoded user payload to req.user.
 *
 * In production, replace the stub token generation with a real
 * /auth/login endpoint that validates credentials against a users table.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }
}

/**
 * Authorization middleware factory.
 * Restricts access to users with specific roles.
 *
 * @param {...string} roles - Allowed role names (e.g., 'admin', 'manager')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());

    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    return next();
  };
}

/**
 * Generate a JWT token (utility for testing / seeding).
 * In production, this belongs in an auth service with password validation.
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

module.exports = { authenticate, authorize, generateToken };
