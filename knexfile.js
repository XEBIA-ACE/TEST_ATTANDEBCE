require('dotenv').config();

/**
 * Knex database configuration for multiple environments.
 * Uses environment variables for all sensitive connection details.
 */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'attendance_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
    },
    migrations: {
      directory: './src/infrastructure/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/infrastructure/database/seeds',
    },
  },

  test: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME_TEST || 'attendance_db_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    pool: { min: 1, max: 5 },
    migrations: {
      directory: './src/infrastructure/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/infrastructure/database/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
    },
    migrations: {
      directory: './src/infrastructure/database/migrations',
      tableName: 'knex_migrations',
    },
  },
};
