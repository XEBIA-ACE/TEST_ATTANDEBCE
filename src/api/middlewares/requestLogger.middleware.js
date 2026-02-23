const logger = require('../../config/logger.config');

/**
 * Logs each request on completion with method, path, status, and duration.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // Mask the Authorization header value for security
  const sanitizedHeaders = { ...req.headers };
  if (sanitizedHeaders.authorization) {
    sanitizedHeaders.authorization = 'Bearer [REDACTED]';
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('HTTP request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id,
    });
  });

  next();
}

module.exports = requestLogger;
