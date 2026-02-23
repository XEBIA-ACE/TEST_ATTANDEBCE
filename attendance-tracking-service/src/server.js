'use strict';

const app = require('./app');
const logger = require('./config/logger');
const { pool } = require('./config/database');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  // Verify database connectivity before accepting traffic
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connection established');
  } catch (err) {
    logger.error('Failed to connect to the database', { error: err.message });
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Attendance Tracking Service started`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      docs: `http://localhost:${PORT}/api-docs`,
    });
  });

  // ─── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received – shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await pool.end();
      logger.info('Database pool closed');
      process.exit(0);
    });

    // Force exit after 10 s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

start();
