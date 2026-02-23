const knex = require('knex');
const knexConfig = require('../../knexfile');
const logger = require('./logger');

const env = process.env.NODE_ENV || 'development';
const config = knexConfig[env];

/**
 * Singleton database connection instance using Knex.js.
 * Configured per environment via knexfile.js.
 */
const db = knex(config);

// Verify database connectivity on startup
db.raw('SELECT 1')
  .then(() => logger.info('Database connection established', { env }))
  .catch((err) => {
    logger.error('Database connection failed', { error: err.message, env });
    process.exit(1);
  });

module.exports = db;
