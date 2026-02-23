/**
 * Integration tests for the Attendance API routes.
 * Uses an in-memory SQLite database with real migrations.
 * Validates request/response contracts end-to-end.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const { app } = require('../../src/app');
const { getDatabase, runMigrations, closeDatabase } = require('../../src/config/database');
const { generateToken } = require('../../src/api/middleware/auth.middleware');
const { v4: uuidv4 } = require('uuid');

// Tokens for different roles
const adminToken = generateToken({ id: 'admin-1', role: 'admin' });
const employeeToken = generateToken({ id: 'user-1', role: 'employee' });

let db;
let employeeId;

beforeAll(async () => {
  await runMigrations();
  db = getDatabase();

  // Seed a test employee
  employeeId = uuidv4();
  await db('employees').insert({
    id: employeeId,
    employee_code: 'TEST-001',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  // Clean attendance records between tests to avoid state leakage
  await db('attendance_records').delete();
});

describe('POST /api/v1/attendance/check-in', () => {
  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app).post('/api/v1/attendance/check-in').send({ employee_id: employeeId });
    expect(res.status).toBe(401);
  });

  it('returns 201 and creates a check-in record', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId, notes: 'Integration test' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      employee_id: employeeId,
      status: 'present',
    });
    expect(res.body.data.check_in).toBeTruthy();
  });

  it('returns 409 when employee checks in twice on the same day', async () => {
    // First check-in
    await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    // Second check-in on the same day
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 400 when employee_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/attendance/check-out', () => {
  it('returns 200 and updates record with check_out and total_hours', async () => {
    // First check in
    await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    // Then check out
    const res = await request(app)
      .post('/api/v1/attendance/check-out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    expect(res.status).toBe(200);
    expect(res.body.data.check_out).toBeTruthy();
    expect(typeof res.body.data.total_hours).toBe('number');
  });

  it('returns 404 when checking out without prior check-in', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/attendance', () => {
  it('returns 200 with paginated attendance records', async () => {
    const res = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('filters by employee_id', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance?employee_id=${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/health', () => {
  it('returns 200 with service status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns 200 from readiness check', async () => {
    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.checks.database).toBe('ok');
  });
});
