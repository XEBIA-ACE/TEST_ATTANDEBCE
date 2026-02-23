'use strict';

require('dotenv').config();

const app = require('./app');
const config = require('./config');
const { checkConnection } = require('./config/database');
const logger = require('./utils/logger');

const PORT = config.server.port;

async function start() {
  // Verify DB is reachable before accepting traffic
  const dbOk = await checkConnection();
  if (!dbOk) {
    logger.error('Cannot connect to database. Exiting.');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Attendance Tracking Service started`, {
      port: PORT,
      env: config.env,
      apiBase: `/api/${config.server.apiVersion}`,
      docs: config.isProd ? 'disabled' : `http://localhost:${PORT}/api-docs`,
    });
  });

  // Graceful shutdown: stop accepting new connections and wait for in-flight requests
  function shutdown(signal) {
    logger.info(`Received ${signal}. Shutting down gracefully…`);
    server.close(async () => {
      const { destroyConnection } = require('./config/database');
      await destroyConnection();
      logger.info('Server and DB connections closed. Goodbye.');
      process.exit(0);
    });

    // Force exit after 10 seconds if requests haven't drained
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Log unhandled promise rejections (should never happen in production)
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
  });
}

start();
