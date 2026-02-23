// Global test configuration and helpers

// Silence logger output during tests
jest.mock('../src/config/logger.config', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Increase default test timeout for integration tests
jest.setTimeout(30000);
