'use strict';

const logger = require('../../utils/logger');

/**
 * Express middleware that logs every inbound request and its response.
 * Sensitive headers (Authorization, Cookie) are redacted from logs.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Intercept response to log status + duration
  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const duration = Date.now() - start;
    const logFn = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logFn]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });

    return originalEnd(...args);
  };

  next();
}

module.exports = requestLogger;
