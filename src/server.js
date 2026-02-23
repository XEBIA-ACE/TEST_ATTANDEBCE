require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./database/connection');
const logger = require('./config/logger.config');
const appConfig = require('./config/app.config');

const { port } = appConfig;

async function startServer() {
  try {
    // Verify database connection before accepting traffic
    await connectDatabase();

    const server = app.listen(port, () => {
      logger.info(`${appConfig.appName} v${appConfig.appVersion} started`, {
        port,
        env: appConfig.env,
        docs: appConfig.env !== 'production' ? `http://localhost:${port}/api-docs` : 'disabled',
      });
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        try {
          const { sequelize } = require('./database/connection');
          await sequelize.close();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error('Error closing database connection', { error: err.message });
        }
        logger.info('Server shutdown complete');
        process.exit(0);
      });

      // Force-kill if shutdown takes too long
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();
