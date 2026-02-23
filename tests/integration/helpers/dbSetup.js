'use strict';

const knex = require('knex');
const knexConfigs = require('../../../src/config/knexfile');

// Use the test (SQLite in-memory) configuration for integration tests
const testDb = knex(knexConfigs.test);

async function setupTestDb() {
  await testDb.migrate.latest({ directory: './src/db/migrations' });
}

async function teardownTestDb() {
  await testDb.migrate.rollback({ all: true, directory: './src/db/migrations' });
  await testDb.destroy();
}

async function clearTables() {
  // Order respects FK constraints
  await testDb('attendance_records').del();
  await testDb('employees').del();
}

module.exports = { testDb, setupTestDb, teardownTestDb, clearTables };
