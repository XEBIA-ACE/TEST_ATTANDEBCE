'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
      release: jest.fn(),
    }),
    on: jest.fn(),
    end: jest.fn(),
  },
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Health endpoints', () => {
  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('GET /health/ready', () => {
    it('returns 200 when database is connected', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.database).toBe('connected');
    });

    it('returns 503 when database is unavailable', async () => {
      pool.connect.mockRejectedValueOnce(new Error('Connection refused'));

      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('not ready');
    });
  });

  describe('GET /metrics', () => {
    it('returns 200 with process metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.body.uptime_seconds).toBeDefined();
      expect(res.body.memory).toBeDefined();
      expect(res.body.node_version).toBeDefined();
    });
  });
});
