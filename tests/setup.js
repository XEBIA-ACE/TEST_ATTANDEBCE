'use strict';

/**
 * Global test setup.
 * Sets NODE_ENV to 'test' so that:
 *  - Winston logger is silenced
 *  - JWT secret check is skipped
 *  - Sequelize uses an in-memory SQLite database
 */
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test_secret_key_at_least_32_chars_long__';
process.env.PORT = '0'; // random port for tests
