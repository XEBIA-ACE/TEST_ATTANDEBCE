'use strict';

const { Pool } = require('pg');

/**
 * PostgreSQL connection pool.
 * Configured via environment variables; supports dev/staging/prod.
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'attendance_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // Log unexpected idle client errors without crashing the process
  const logger = require('./logger');
  logger.error('Unexpected error on idle database client', { error: err.message });
});

/**
 * Execute a single SQL query using the pool.
 * @param {string} text  - SQL query string
 * @param {Array}  params - Parameterised values
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Acquire a client for multi-statement transactions.
 * Caller MUST release the client when done.
 * @returns {Promise<import('pg').PoolClient>}
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
