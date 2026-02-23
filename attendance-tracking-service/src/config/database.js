'use strict';

const knex = require('knex');
const knexConfig = require('./knexfile');
const env = require('./env');
const logger = require('../utils/logger');

let db = null;

/**
 * Returns a singleton Knex database connection.
 * Lazily initialized on first call.
 */
function getDb() {
  if (!db) {
    const config = knexConfig[env.app.env] || knexConfig.development;
    db = knex(config);

    db.on('query', (query) => {
      if (env.app.isDev) {
        logger.debug('SQL query executed', { sql: query.sql, bindings: query.bindings });
      }
    });
  }
  return db;
}

/**
 * Checks database connectivity.
 * @returns {Promise<boolean>}
 */
async function checkConnection() {
  try {
    await getDb().raw('SELECT 1');
    return true;
  } catch (err) {
    logger.error('Database connection check failed', { error: err.message });
    return false;
  }
}

/**
 * Gracefully destroys the database connection pool.
 */
async function closeDb() {
  if (db) {
    await db.destroy();
    db = null;
    logger.info('Database connection pool closed');
  }
}

module.exports = { getDb, checkConnection, closeDb };
