'use strict';

const app = require('./app');
const env = require('./config/env');
const { checkConnection, closeDb } = require('./config/database');
const logger = require('./utils/logger');

const PORT = env.app.port;

async function startServer() {
  // Verify database connectivity before accepting traffic
  const dbConnected = await checkConnection();
  if (!dbConnected && env.app.isProd) {
    logger.error('Cannot connect to database. Exiting.');
    process.exit(1);
  }
  if (!dbConnected) {
    logger.warn('Database connection failed — starting in degraded mode (dev only)');
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server started`, {
      port: PORT,
      environment: env.app.env,
      docs: `http://localhost:${PORT}/api-docs`,
      health: `http://localhost:${PORT}/health`,
    });
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await closeDb();
      logger.info('Database connections closed');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', { reason, promise });
    if (env.app.isProd) {
      shutdown('unhandledRejection');
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });

  return server;
}

startServer().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
