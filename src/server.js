'use strict';

const app = require('./app');
const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./db');
const logger = require('./utils/logger');

let server;

async function start() {
  // Ensure DB is reachable before accepting traffic
  await connectDatabase();

  server = app.listen(config.server.port, () => {
    logger.info(`${config.server.serviceName} started`, {
      port: config.server.port,
      env: config.env,
      apiBase: `/api/${config.server.apiVersion}`,
      docs: config.isDevelopment ? `http://localhost:${config.server.port}/api-docs` : 'disabled',
    });
  });

  server.on('error', (err) => {
    logger.error('Server error', { error: err.message });
    process.exit(1);
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10 seconds if connections don't drain
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  }
}

// Graceful shutdown hooks
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Crash protection: log and exit on unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start().catch((err) => {
  logger.error('Startup failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
