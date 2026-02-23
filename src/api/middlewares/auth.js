const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * JWT authentication middleware.
 * Validates the Bearer token from the Authorization header and
 * attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required — provide a Bearer token', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return next(err); // Caught by errorHandler (JsonWebTokenError / TokenExpiredError)
  }
};

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin') or authorize('admin', 'manager')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions for this action', 403));
  }

  return next();
};

module.exports = { authenticate, authorize };
