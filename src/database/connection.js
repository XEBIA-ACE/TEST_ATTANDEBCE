const { Sequelize } = require('sequelize');
const databaseConfig = require('../config/database.config');
const logger = require('../config/logger.config');

const env = process.env.NODE_ENV || 'development';
const config = databaseConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    ...(config.dialectOptions && { dialectOptions: config.dialectOptions }),
  },
);

/**
 * Test database connectivity and authenticate.
 * Throws on failure so the server can exit gracefully.
 */
async function connectDatabase() {
  await sequelize.authenticate();
  logger.info('Database connection established successfully');
}

module.exports = { sequelize, connectDatabase };
