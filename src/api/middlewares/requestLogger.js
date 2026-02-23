const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger');

/**
 * Attaches a unique request ID to each request and logs
 * method, URL, status code, and response time for every request.
 */
const requestLogger = (req, res, next) => {
  req.id = uuidv4();
  const startTime = Date.now();

  res.setHeader('X-Request-Id', req.id);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]('HTTP request', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  });

  next();
};

module.exports = requestLogger;
