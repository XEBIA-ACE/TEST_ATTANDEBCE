'use strict';

const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

/**
 * HTTP request/response logger middleware.
 *
 * Assigns a unique request ID to each request (propagated through logs),
 * and logs method, path, status code, and response time.
 */
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  const startTime = Date.now();

  // Make request ID accessible to all handlers and propagate it in the response
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]('HTTP request', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });

  next();
};

module.exports = requestLogger;
