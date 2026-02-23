'use strict';

require('../setup');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { sequelize } = require('../../src/data/database');
const { Employee, Attendance } = require('../../src/data/models');

// Generate a valid JWT for use in requests
const TEST_JWT_SECRET = process.env.JWT_SECRET;
const authToken = jwt.sign(
  { id: 'admin-uuid', email: 'admin@test.com', role: 'admin' },
  TEST_JWT_SECRET,
  { expiresIn: '1h' }
);
const authHeader = `Bearer ${authToken}`;

let testEmployee;

// ── Database bootstrap ────────────────────────────────────────────────────────
beforeAll(async () => {
  await sequelize.sync({ force: true });

  testEmployee = await Employee.create({
    employeeCode: 'TEST-001',
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    isActive: true,
    expectedHoursPerDay: 8,
  });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  // Clean up attendance records between tests to avoid state leakage
  await Attendance.destroy({ where: {}, truncate: true });
});

// ── Health endpoint ───────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Employee endpoints ────────────────────────────────────────────────────────
describe('Employees API', () => {
  describe('GET /api/v1/employees', () => {
    it('returns 401 without auth header', async () => {
      const res = await request(app).get('/api/v1/employees');
      expect(res.status).toBe(401);
    });

    it('returns paginated employees', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });
  });

  describe('POST /api/v1/employees', () => {
    it('creates an employee and returns 201', async () => {
      const payload = {
        employeeCode: 'NEW-001',
        firstName: 'New',
        lastName: 'Employee',
        email: 'new.employee@example.com',
      };

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', authHeader)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.employeeCode).toBe('NEW-001');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('returns 400 on validation failure', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', authHeader)
        .send({ firstName: 'Only' }); // missing required fields

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 409 on duplicate employeeCode', async () => {
      const payload = {
        employeeCode: 'TEST-001', // already exists
        firstName: 'Dup',
        lastName: 'Code',
        email: 'dup.code@example.com',
      };

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', authHeader)
        .send(payload);

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/employees/:id', () => {
    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .get('/api/v1/employees/00000000-0000-0000-0000-000000000000')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
    });

    it('returns the employee for a valid id', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${testEmployee.id}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testEmployee.id);
    });
  });
});

// ── Attendance endpoints ──────────────────────────────────────────────────────
describe('Attendance API', () => {
  describe('POST /api/v1/attendance/check-in', () => {
    it('records a check-in and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employeeId: testEmployee.id });

      expect(res.status).toBe(201);
      expect(res.body.data.employeeId).toBe(testEmployee.id);
      expect(['present', 'late']).toContain(res.body.data.status);
    });

    it('returns 409 if already checked in today', async () => {
      // First check-in
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employeeId: testEmployee.id });

      // Second check-in – should fail
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employeeId: testEmployee.id });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/attendance/check-out', () => {
    it('returns 400 when no check-in exists', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', authHeader)
        .send({ employeeId: testEmployee.id });

      expect(res.status).toBe(400);
    });

    it('records a check-out after check-in', async () => {
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employeeId: testEmployee.id });

      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', authHeader)
        .send({ employeeId: testEmployee.id });

      expect(res.status).toBe(200);
      expect(res.body.data.checkOut).not.toBeNull();
    });
  });

  describe('GET /api/v1/attendance/report', () => {
    it('returns a summary for a date range', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get('/api/v1/attendance/report')
        .set('Authorization', authHeader)
        .query({ startDate: today, endDate: today });

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toHaveProperty('totalDays');
    });

    it('returns 400 when startDate is missing', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get('/api/v1/attendance/report')
        .set('Authorization', authHeader)
        .query({ endDate: today });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/attendance', () => {
    it('returns paginated list', async () => {
      const res = await request(app)
        .get('/api/v1/attendance')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
