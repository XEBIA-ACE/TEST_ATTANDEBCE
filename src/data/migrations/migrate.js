#!/usr/bin/env node
'use strict';

/**
 * Simple migration runner.
 * Uses Sequelize's sync() with alter option as an easy migration strategy for
 * development/staging. For production, swap this for a proper migration tool
 * like sequelize-cli or db-migrate.
 *
 * Usage:
 *   node src/data/migrations/migrate.js          # sync (create/alter tables)
 *   node src/data/migrations/migrate.js --undo   # drop all tables (DANGEROUS)
 */

require('dotenv').config();

const { sequelize } = require('../database');
const { Employee, Attendance } = require('../models');
const logger = require('../../utils/logger');

const isUndo = process.argv.includes('--undo');

async function migrate() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    if (isUndo) {
      logger.warn('Running UNDO migration – all tables will be dropped!');
      await sequelize.drop();
      logger.info('All tables dropped.');
    } else {
      // Order matters: Employee must exist before Attendance FK
      await Employee.sync({ alter: true });
      await Attendance.sync({ alter: true });
      logger.info('Database schema synchronised.');
    }
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
