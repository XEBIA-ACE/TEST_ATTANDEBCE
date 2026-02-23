'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const env = require('../config/env');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

/**
 * Human-readable format for development console output.
 */
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    let log = `${ts} [${level}]: ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length > 0) log += `\n${JSON.stringify(meta, null, 2)}`;
    return log;
  })
);

/**
 * Structured JSON format for production.
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const transports = [];

// Always log to console
transports.push(
  new winston.transports.Console({
    format: env.app.isDev ? devFormat : prodFormat,
    silent: env.app.isTest,
  })
);

// Rotate file transport for non-test environments
if (!env.app.isTest) {
  transports.push(
    new DailyRotateFile({
      dirname: env.logging.dir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: prodFormat,
    })
  );

  transports.push(
    new DailyRotateFile({
      dirname: env.logging.dir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: prodFormat,
    })
  );
}

const logger = winston.createLogger({
  level: env.logging.level,
  defaultMeta: { service: env.app.name, environment: env.app.env },
  transports,
  exitOnError: false,
});

module.exports = logger;
