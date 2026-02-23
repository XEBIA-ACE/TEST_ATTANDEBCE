'use strict';

require('dotenv').config();

/**
 * Centralized environment configuration with validation.
 * All environment variables are accessed through this module.
 */
const env = {
  app: {
    name: process.env.APP_NAME || 'attendance-tracking-service',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    isDev: (process.env.NODE_ENV || 'development') === 'development',
    isProd: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
  db: {
    client: process.env.DB_CLIENT || 'pg',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'attendance_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
  },
};

/**
 * Validate required environment variables in production.
 */
function validateEnv() {
  if (env.app.isProd) {
    const required = ['JWT_SECRET', 'DB_PASSWORD'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    if (process.env.JWT_SECRET === 'change-this-secret-in-production') {
      throw new Error('JWT_SECRET must be changed from default value in production');
    }
  }
}

validateEnv();

module.exports = env;
