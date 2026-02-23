'use strict';

const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger');

/**
 * Attach a unique request ID to every incoming request.
 * The ID is available as req.id and echoed back in the X-Request-Id header.
 */
function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
}

/**
 * Structured request / response logger.
 * Logs method, url, status, duration, and request ID.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('HTTP request', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
}

module.exports = { requestId, requestLogger };
