require('dotenv').config();

/**
 * Knex configuration for multiple environments.
 * Uses environment variables for all sensitive connection details.
 */
const baseConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'attendance_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  migrations: {
    directory: './src/data/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/data/seeds',
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  },
};

module.exports = {
  development: {
    ...baseConfig,
    debug: true,
  },
  test: {
    ...baseConfig,
    connection: {
      ...baseConfig.connection,
      database: process.env.DB_NAME_TEST || 'attendance_db_test',
    },
    pool: { min: 1, max: 5 },
  },
  staging: {
    ...baseConfig,
    pool: { min: 2, max: 10 },
  },
  production: {
    ...baseConfig,
    pool: { min: 2, max: 20 },
    connection: {
      ...baseConfig.connection,
      ssl: { rejectUnauthorized: false },
    },
  },
};
