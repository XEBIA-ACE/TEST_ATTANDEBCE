const jwt = require('jsonwebtoken');
const appConfig = require('../../config/app.config');
const { UnauthorizedError, ForbiddenError } = require('../../utils/errors');

/**
 * Middleware: verify Bearer JWT.
 *
 * In a real deployment this would hit a user store; here it validates
 * the signature and expiry, then attaches the decoded payload to req.user.
 */
function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Bearer token required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, appConfig.jwt.secret);
    req.user = decoded; // { sub, role, iat, exp, … }
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }
}

/**
 * Factory: require the authenticated user to have a specific role.
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'manager')
 */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not permitted`));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
