'use strict';

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database.config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(dbConfig);

/**
 * Test the database connection.
 * Call this once during application startup.
 */
async function connectDatabase() {
  await sequelize.authenticate();
  logger.info(`Database connected [dialect: ${dbConfig.dialect}]`);
}

module.exports = { sequelize, connectDatabase };
