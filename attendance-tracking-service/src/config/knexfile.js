'use strict';

require('dotenv').config();

/**
 * Knex configuration for multiple environments.
 * Used by both the application and knex CLI for migrations/seeds.
 */
const baseConfig = {
  client: process.env.DB_CLIENT || 'pg',
  migrations: {
    directory: `${__dirname}/../infrastructure/database/migrations`,
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: `${__dirname}/../infrastructure/database/seeds`,
  },
};

module.exports = {
  development: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'attendance_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    },
    pool: {
      min: 2,
      max: 10,
    },
    debug: true,
  },

  test: {
    ...baseConfig,
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'attendance_db_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    },
    pool: {
      min: 1,
      max: 5,
    },
  },

  production: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    },
    debug: false,
  },
};
