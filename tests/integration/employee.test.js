'use strict';

/**
 * Integration tests for the Employee endpoints.
 *
 * These tests require a live PostgreSQL database.
 * Ensure the test DB is running and migrations have been applied:
 *
 *   NODE_ENV=test DB_NAME=attendance_db_test npm run migrate
 *   NODE_ENV=test DB_NAME=attendance_db_test npm run test:integration
 */

const request = require('supertest');
const app = require('../../src/app');
const { getDatabase, destroyConnection } = require('../../src/config/database');

let db;

beforeAll(async () => {
  db = getDatabase();
  // Clean state before suite
  await db('attendance_records').del();
  await db('employees').del();
});

afterAll(async () => {
  await db('attendance_records').del();
  await db('employees').del();
  await destroyConnection();
});

describe('POST /api/v1/employees', () => {
  it('creates an employee and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .send({
        employee_code: 'EMP-T01',
        first_name: 'Test',
        last_name: 'User',
        email: 'test.user@example.com',
        department: 'QA',
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.email).toBe('test.user@example.com');
  });

  it('returns 422 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .send({ first_name: 'Incomplete' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 on duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .send({
        employee_code: 'EMP-T02',
        first_name: 'Dup',
        last_name: 'User',
        email: 'test.user@example.com', // same as above
      });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/v1/employees', () => {
  it('returns a paginated list', async () => {
    const res = await request(app).get('/api/v1/employees?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('filters by department', async () => {
    const res = await request(app).get('/api/v1/employees?department=QA');

    expect(res.status).toBe(200);
    res.body.data.forEach((emp) => expect(emp.department).toBe('QA'));
  });
});

describe('GET /api/v1/employees/:id', () => {
  let employeeId;

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/employees').send({
      employee_code: 'EMP-T03',
      first_name: 'Fetch',
      last_name: 'Me',
      email: 'fetch.me@example.com',
    });
    employeeId = res.body.data.id;
  });

  it('returns the employee', async () => {
    const res = await request(app).get(`/api/v1/employees/${employeeId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(employeeId);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/employees/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/employees/:id', () => {
  let employeeId;

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/employees').send({
      employee_code: 'EMP-T04',
      first_name: 'Update',
      last_name: 'Me',
      email: 'update.me@example.com',
    });
    employeeId = res.body.data.id;
  });

  it('updates the employee', async () => {
    const res = await request(app)
      .put(`/api/v1/employees/${employeeId}`)
      .send({ department: 'DevOps' });

    expect(res.status).toBe(200);
    expect(res.body.data.department).toBe('DevOps');
  });
});

describe('DELETE /api/v1/employees/:id', () => {
  let employeeId;

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/employees').send({
      employee_code: 'EMP-T05',
      first_name: 'Delete',
      last_name: 'Me',
      email: 'delete.me@example.com',
    });
    employeeId = res.body.data.id;
  });

  it('soft-deletes (deactivates) the employee', async () => {
    const res = await request(app).delete(`/api/v1/employees/${employeeId}`);
    expect(res.status).toBe(200);

    // Employee should still exist but be inactive
    const fetchRes = await request(app).get(`/api/v1/employees/${employeeId}`);
    expect(fetchRes.body.data.status).toBe('inactive');
  });
});
