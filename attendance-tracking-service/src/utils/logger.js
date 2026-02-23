const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure log directory exists
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Human-readable format for development console output
const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

const transports = [
  // Always write to rotating file in JSON format
  new winston.transports.File({
    filename: config.logging.file,
    format: combine(timestamp(), errors({ stack: true }), json()),
    maxsize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: config.logging.file.replace('.log', '.error.log'),
    level: 'error',
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),
];

// Add colorized console output in non-production environments
if (config.env !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        devFormat
      ),
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: config.appName },
  transports,
  // Do not exit on unhandled errors
  exitOnError: false,
});

module.exports = logger;
