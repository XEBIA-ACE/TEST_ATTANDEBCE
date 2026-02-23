'use strict';

const knex = require('knex');
const config = require('./index');
const logger = require('../utils/logger');

let db;

/**
 * Returns a singleton Knex database instance.
 * Lazy-initialises on first call so tests can swap configuration.
 */
function getDatabase() {
  if (!db) {
    db = knex({
      client: 'pg',
      connection: {
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.password,
      },
      pool: {
        min: config.db.pool.min,
        max: config.db.pool.max,
        afterCreate(conn, done) {
          conn.query('SET timezone="UTC";', (err) => done(err, conn));
        },
      },
      debug: config.isDev,
    });

    db.on('query', (query) => {
      if (config.isDev) {
        logger.debug('DB Query', { sql: query.sql, bindings: query.bindings });
      }
    });
  }

  return db;
}

async function checkConnection() {
  try {
    await getDatabase().raw('SELECT 1');
    return true;
  } catch (err) {
    logger.error('Database connection failed', { error: err.message });
    return false;
  }
}

async function destroyConnection() {
  if (db) {
    await db.destroy();
    db = null;
  }
}

module.exports = { getDatabase, checkConnection, destroyConnection };
