'use strict';

const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 *
 * Expects:  Authorization: Bearer <token>
 *
 * Sets req.user = { id, email, role } on success.
 * Returns 401 on missing/invalid/expired token.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing',
    });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'employee',
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Role-based access control middleware factory.
 *
 * Usage:  router.delete('/:id', authenticate, authorize('admin'), handler)
 *
 * @param {...string} roles  - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
