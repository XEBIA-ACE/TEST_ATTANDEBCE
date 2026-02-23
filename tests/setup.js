'use strict';

// Set test environment before any module loads config
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'attendance_db_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.LOG_LEVEL = 'error'; // Suppress logs in tests
