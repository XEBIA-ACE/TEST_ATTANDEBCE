/**
 * Integration tests for the health check endpoint.
 *
 * These tests do NOT require a real database — the database module is mocked.
 */
const request = require('supertest');

// Mock the database connection so the app boots without Postgres
jest.mock('../../src/database/connection', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(true),
  },
  connectDatabase: jest.fn().mockResolvedValue(true),
}));

// Mock models index to avoid DB calls
jest.mock('../../src/models', () => ({
  sequelize: { authenticate: jest.fn(), query: jest.fn() },
  Department: {},
  Employee: {},
  AttendanceRecord: {},
}));

const app = require('../../src/app');

describe('GET /health', () => {
  it('returns 200 with healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      status: 'healthy',
      service: 'attendance-tracking-service',
    });
    expect(res.body.data.checks.database).toBeDefined();
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });
});

describe('GET /metrics', () => {
  it('returns memory and cpu metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      memoryMb: expect.objectContaining({ heapUsed: expect.any(Number) }),
      nodeVersion: expect.any(String),
    });
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
