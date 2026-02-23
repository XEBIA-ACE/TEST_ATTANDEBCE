const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

/**
 * Singleton Knex instance shared across the application.
 * Manages the PostgreSQL connection pool.
 */
const db = knex(config);

module.exports = db;
