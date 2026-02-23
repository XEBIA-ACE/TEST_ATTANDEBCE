const morgan = require('morgan');
const logger = require('../../utils/logger');

// Pipe morgan tokens into winston for structured logging
const stream = {
  write: (message) => logger.http(message.trim()),
};

/**
 * HTTP request logging middleware.
 * Uses morgan for token parsing and routes output through winston.
 */
const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

module.exports = requestLogger;
