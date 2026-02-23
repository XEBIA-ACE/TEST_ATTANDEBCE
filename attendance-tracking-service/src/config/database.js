const knex = require('knex');
const knexfile = require('../../knexfile');
const config = require('./index');
const logger = require('../utils/logger');

let db;

/**
 * Initialize and return the Knex database connection.
 * Reuses existing connection if already initialized.
 */
function getDatabase() {
  if (!db) {
    const env = config.env === 'test' ? 'test' : config.env;
    const knexConfig = knexfile[env] || knexfile.development;

    db = knex(knexConfig);

    db.on('query', (query) => {
      if (config.env === 'development') {
        logger.debug('DB Query', { sql: query.sql, bindings: query.bindings });
      }
    });

    logger.info('Database connection initialized', { env, client: knexConfig.client });
  }
  return db;
}

/**
 * Close the database connection gracefully.
 */
async function closeDatabase() {
  if (db) {
    await db.destroy();
    db = null;
    logger.info('Database connection closed');
  }
}

/**
 * Run pending migrations programmatically.
 */
async function runMigrations() {
  const database = getDatabase();
  const [batchNo, migrations] = await database.migrate.latest();
  if (migrations.length > 0) {
    logger.info('Migrations ran', { batchNo, migrations });
  } else {
    logger.info('No pending migrations');
  }
}

module.exports = { getDatabase, closeDatabase, runMigrations };
