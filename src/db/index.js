'use strict';

const knex = require('knex');
const config = require('../config/env');
const logger = require('../utils/logger');

const knexConfigs = require('../config/knexfile');

const environment = config.env;
const knexConfig = knexConfigs[environment] || knexConfigs.development;

const db = knex(knexConfig);

/**
 * Verify the database connection is active.
 * Called at startup to fail fast if DB is unreachable.
 */
async function connectDatabase() {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established', {
      client: knexConfig.client,
      host: typeof knexConfig.connection === 'object' ? knexConfig.connection.host : 'in-memory',
      database: typeof knexConfig.connection === 'object' ? knexConfig.connection.database : ':memory:',
    });
    return db;
  } catch (err) {
    logger.error('Failed to connect to database', { error: err.message });
    throw err;
  }
}

/**
 * Gracefully destroy the connection pool.
 * Called during shutdown to release resources.
 */
async function disconnectDatabase() {
  await db.destroy();
  logger.info('Database connection closed');
}

module.exports = { db, connectDatabase, disconnectDatabase };
