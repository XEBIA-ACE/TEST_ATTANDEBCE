'use strict';

const morgan = require('morgan');
const logger = require('../../utils/logger');

// Pipe morgan tokens into the winston logger
const stream = {
  write: (message) => logger.http(message.trim()),
};

// Use 'combined' format in prod for standard Apache log fields; 'dev' otherwise
const format =
  process.env.NODE_ENV === 'production'
    ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
    : 'dev';

module.exports = morgan(format, { stream });
