const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const appConfig = require('./app.config');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logDir = path.resolve(process.cwd(), appConfig.logging.dir);

// File transport for rotating daily logs
const fileTransport = new DailyRotateFile({
  dirname: logDir,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: appConfig.logging.level,
  format: combine(timestamp(), errors({ stack: true }), json()),
});

// Error-specific file transport
const errorFileTransport = new DailyRotateFile({
  dirname: logDir,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

const transports = [fileTransport, errorFileTransport];

// Console transport for non-production environments
if (appConfig.env !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    }),
  );
}

const logger = winston.createLogger({
  level: appConfig.logging.level,
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: {
    service: appConfig.appName,
    version: appConfig.appVersion,
    env: appConfig.env,
  },
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      dirname: logDir,
      filename: 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      dirname: logDir,
      filename: 'rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

module.exports = logger;
