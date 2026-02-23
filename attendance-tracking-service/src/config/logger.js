'use strict';

const winston = require('winston');

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Human-readable format for local development.
 */
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
  })
);

/**
 * Structured JSON format for production / log aggregators.
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isDevelopment ? devFormat : prodFormat,
  defaultMeta: { service: 'attendance-tracking-service' },
  transports: [
    new winston.transports.Console(),
  ],
});

// Write error-level logs to a separate file in production
if (!isDevelopment) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 20 * 1024 * 1024,
      maxFiles: 10,
    })
  );
}

module.exports = logger;
