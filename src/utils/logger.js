'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

// Human-readable format for development console
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${ts} [${level}]: ${stack || message} ${metaStr}`;
});

const transports = [];

// Always log to console
transports.push(
  new winston.transports.Console({
    format: config.isDev
      ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), splat(), devFormat)
      : combine(timestamp(), errors({ stack: true }), json()),
  })
);

// Rotate log files in non-test environments
if (!config.isTest) {
  const logDir = path.resolve(config.logging.dir);

  transports.push(
    new DailyRotateFile({
      dirname: logDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: combine(timestamp(), errors({ stack: true }), json()),
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: 'attendance-tracking-service' },
  transports,
  exitOnError: false,
});

module.exports = logger;
