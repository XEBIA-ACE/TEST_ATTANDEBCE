'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { getDb, closeDb } = require('../../src/config/database');
const { generateToken } = require('../../src/api/middlewares/auth');

const authToken = generateToken({ id: 'test-user', role: 'admin' });
const authHeader = `Bearer ${authToken}`;

let db;
let testEmployee;

beforeAll(async () => {
  db = getDb();
  await db.migrate.latest();
});

afterAll(async () => {
  await db.migrate.rollback(undefined, true);
  await closeDb();
});

beforeEach(async () => {
  await db('attendance_records').del();
  await db('employees').del();

  // Create a test employee for attendance tests
  const res = await request(app)
    .post('/api/v1/employees')
    .set('Authorization', authHeader)
    .send({
      employee_number: 'EMP001',
      first_name: 'Test',
      last_name: 'Employee',
      email: 'test.employee@example.com',
      department: 'Engineering',
      position: 'Developer',
      hire_date: '2023-01-01',
    });

  testEmployee = res.body.data;
});

describe('Attendance API', () => {
  describe('POST /api/v1/attendance/check-in', () => {
    it('should record check-in for active employee', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        employee_id: testEmployee.id,
        status: 'present',
      });
      expect(res.body.data.check_in).toBeDefined();
      expect(res.body.data.check_out).toBeNull();
    });

    it('should reject duplicate check-in on same day', async () => {
      // First check-in
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      // Second check-in attempt
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      expect(res.status).toBe(409);
    });

    it('should return 404 for nonexistent employee', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employee_id: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for missing employee_id', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/attendance/check-out', () => {
    beforeEach(async () => {
      // Check in first
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });
    });

    it('should record check-out and calculate total hours', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      expect(res.status).toBe(200);
      expect(res.body.data.check_out).toBeDefined();
      expect(res.body.data.total_hours).toBeGreaterThanOrEqual(0);
    });

    it('should reject check-out if already checked out', async () => {
      // First check-out
      await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      // Second check-out attempt
      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/attendance', () => {
    it('should list attendance records', async () => {
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      const res = await request(app)
        .get('/api/v1/attendance')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });

    it('should filter by employee_id', async () => {
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      const res = await request(app)
        .get(`/api/v1/attendance?employee_id=${testEmployee.id}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.every((r) => r.employee_id === testEmployee.id)).toBe(true);
    });
  });

  describe('GET /api/v1/attendance/reports/employee/:id', () => {
    it('should return employee attendance summary', async () => {
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', authHeader)
        .send({ employee_id: testEmployee.id });

      const res = await request(app)
        .get(
          `/api/v1/attendance/reports/employee/${testEmployee.id}?date_from=2024-01-01&date_to=2024-12-31`
        )
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        employee_id: testEmployee.id,
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      });
    });
  });
});
