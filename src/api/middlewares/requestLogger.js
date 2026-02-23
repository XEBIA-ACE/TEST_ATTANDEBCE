const morgan = require('morgan');
const logger = require('../../config/logger');

/**
 * HTTP request logger using morgan with a Winston stream.
 * Logs method, URL, status, response time, and content-length.
 */
const stream = {
  write: (message) => logger.http(message.trim()),
};

const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

module.exports = requestLogger;
