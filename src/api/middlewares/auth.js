const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Validates Bearer tokens and attaches decoded payload to req.user.
 *
 * Replace the placeholder secret logic with a proper key-management
 * solution (e.g. AWS Secrets Manager, Vault) in production.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is missing or malformed',
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid authentication token';
    return res.status(401).json({ success: false, message });
  }
}

/**
 * Role-based access control guard.
 * Usage: authorize('admin', 'manager')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
