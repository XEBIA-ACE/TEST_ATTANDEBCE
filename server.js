require('dotenv').config();

const app = require('./src/app');
const logger = require('./src/config/logger');
const db = require('./src/config/database');

const PORT = parseInt(process.env.PORT, 10) || 3000;

/**
 * Starts the HTTP server after verifying the database connection.
 */
async function startServer() {
  try {
    // Verify database connectivity before accepting traffic
    await db.raw('SELECT 1');
    logger.info('Database connection established');

    const server = app.listen(PORT, () => {
      logger.info(`Attendance Tracking Service running`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
      });
    });

    // Graceful shutdown handlers
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await db.destroy();
        logger.info('Database connection pool closed');
        process.exit(0);
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();
