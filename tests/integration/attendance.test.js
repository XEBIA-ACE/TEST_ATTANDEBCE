'use strict';

/**
 * Integration tests for Attendance endpoints.
 * Requires a running PostgreSQL test database with migrations applied.
 */

const request = require('supertest');
const app = require('../../src/app');
const { getDatabase, destroyConnection } = require('../../src/config/database');

let db;
let testEmployeeId;

beforeAll(async () => {
  db = getDatabase();
  await db('attendance_records').del();
  await db('employees').del();

  // Create a reusable test employee
  const [emp] = await db('employees').insert({
    employee_code: 'EMP-ATT01',
    first_name: 'Attendance',
    last_name: 'Test',
    email: 'attendance.test@example.com',
    status: 'active',
  }).returning('id');

  testEmployeeId = emp.id;
});

afterAll(async () => {
  await db('attendance_records').del();
  await db('employees').del();
  await destroyConnection();
});

afterEach(async () => {
  // Clean attendance records between tests to avoid state leakage
  await db('attendance_records').del();
});

describe('POST /api/v1/attendance/check-in', () => {
  it('creates a check-in record and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .send({
        employee_id: testEmployeeId,
        check_in_time: '2024-01-15T08:00:00Z',
        notes: 'On time',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee_id).toBe(testEmployeeId);
    expect(res.body.data.check_in_time).toBeDefined();
    expect(res.body.data.status).toBe('present');
  });

  it('marks check-in as late when after 09:15 UTC', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .send({
        employee_id: testEmployeeId,
        check_in_time: '2024-01-15T09:30:00Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('late');
  });

  it('returns 409 on duplicate check-in for the same day', async () => {
    // First check-in
    await request(app).post('/api/v1/attendance/check-in').send({
      employee_id: testEmployeeId,
      check_in_time: '2024-01-15T08:00:00Z',
    });

    // Duplicate
    const res = await request(app).post('/api/v1/attendance/check-in').send({
      employee_id: testEmployeeId,
      check_in_time: '2024-01-15T09:00:00Z',
    });

    expect(res.status).toBe(409);
  });

  it('returns 422 when employee_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .send({ notes: 'No employee' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/attendance/check-out', () => {
  beforeEach(async () => {
    // Ensure there's a check-in to check out from
    await request(app).post('/api/v1/attendance/check-in').send({
      employee_id: testEmployeeId,
      check_in_time: '2024-01-15T08:00:00Z',
    });
  });

  it('records check-out and calculates work hours', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-out')
      .send({
        employee_id: testEmployeeId,
        check_out_time: '2024-01-15T16:30:00Z',
      });

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.data.work_hours)).toBe(8.5);
  });

  it('returns 409 on duplicate check-out', async () => {
    await request(app).post('/api/v1/attendance/check-out').send({
      employee_id: testEmployeeId,
      check_out_time: '2024-01-15T16:00:00Z',
    });

    const res = await request(app).post('/api/v1/attendance/check-out').send({
      employee_id: testEmployeeId,
      check_out_time: '2024-01-15T17:00:00Z',
    });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/v1/attendance', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/attendance/check-in').send({
      employee_id: testEmployeeId,
      check_in_time: '2024-01-15T08:00:00Z',
    });
  });

  it('returns paginated attendance records', async () => {
    const res = await request(app).get('/api/v1/attendance?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('filters by employee_id', async () => {
    const res = await request(app).get(`/api/v1/attendance?employee_id=${testEmployeeId}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((rec) => expect(rec.employee_id).toBe(testEmployeeId));
  });
});

describe('GET /api/v1/attendance/report', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/attendance/check-in').send({
      employee_id: testEmployeeId,
      check_in_time: '2024-01-15T08:00:00Z',
    });
    await request(app).post('/api/v1/attendance/check-out').send({
      employee_id: testEmployeeId,
      check_out_time: '2024-01-15T17:00:00Z',
    });
  });

  it('returns an aggregated report', async () => {
    const res = await request(app).get(
      `/api/v1/attendance/report?employee_id=${testEmployeeId}`
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const entry = res.body.data.find((r) => r.employee_id === testEmployeeId);
    expect(entry).toBeDefined();
    expect(Number(entry.total_days)).toBe(1);
  });
});
