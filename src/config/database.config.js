'use strict';

require('dotenv').config();

const path = require('path');

const dialect = process.env.DB_DIALECT || 'sqlite';

const configs = {
  sqlite: {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.join(process.cwd(), 'data', 'attendance.db'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },

  postgres: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'attendance_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  },
};

const dbConfig = configs[dialect];

if (!dbConfig) {
  console.error(`Unsupported DB_DIALECT: "${dialect}". Use "sqlite" or "postgres".`);
  process.exit(1);
}

module.exports = dbConfig;
