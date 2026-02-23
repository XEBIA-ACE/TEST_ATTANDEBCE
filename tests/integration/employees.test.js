'use strict';

/**
 * Integration tests for the /employees endpoints.
 *
 * Uses SQLite in-memory DB (via knex test config) and supertest to
 * spin up the full Express app without a running HTTP server.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../../src/app');

// Override the db module to use the in-memory test instance
const knex = require('knex');
const knexConfigs = require('../../src/config/knexfile');
const testDb = knex(knexConfigs.test);

// Patch the db singleton used by repositories
jest.mock('../../src/db', () => ({
  db: testDb,
  connectDatabase: jest.fn().mockResolvedValue(),
  disconnectDatabase: jest.fn().mockResolvedValue(),
}));

const BASE_URL = '/api/v1/employees';

beforeAll(async () => {
  await testDb.migrate.latest({ directory: './src/db/migrations' });
});

afterAll(async () => {
  await testDb.migrate.rollback({ all: true, directory: './src/db/migrations' });
  await testDb.destroy();
});

beforeEach(async () => {
  await testDb('attendance_records').del();
  await testDb('employees').del();
});

const validEmployee = {
  employee_code: 'EMP001',
  first_name: 'Alice',
  last_name: 'Johnson',
  email: 'alice@example.com',
  department: 'Engineering',
  position: 'Engineer',
  status: 'active',
};

describe('POST /employees', () => {
  it('creates an employee and returns 201', async () => {
    const res = await request(app).post(BASE_URL).send(validEmployee);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee_code).toBe('EMP001');
    expect(res.body.data.email).toBe('alice@example.com');
    expect(res.body.data.id).toBeDefined();
  });

  it('returns 422 when required fields are missing', async () => {
    const res = await request(app).post(BASE_URL).send({ first_name: 'No Code' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when email already exists', async () => {
    await request(app).post(BASE_URL).send(validEmployee);
    const res = await request(app)
      .post(BASE_URL)
      .send({ ...validEmployee, employee_code: 'EMP002' });
    expect(res.status).toBe(409);
  });

  it('returns 409 when employee_code already exists', async () => {
    await request(app).post(BASE_URL).send(validEmployee);
    const res = await request(app)
      .post(BASE_URL)
      .send({ ...validEmployee, email: 'other@example.com' });
    expect(res.status).toBe(409);
  });
});

describe('GET /employees', () => {
  beforeEach(async () => {
    await request(app).post(BASE_URL).send(validEmployee);
    await request(app)
      .post(BASE_URL)
      .send({ ...validEmployee, employee_code: 'EMP002', email: 'bob@example.com', first_name: 'Bob' });
  });

  it('returns a paginated list of employees', async () => {
    const res = await request(app).get(BASE_URL);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.pagination.total).toBe(2);
  });

  it('filters by status', async () => {
    const res = await request(app).get(`${BASE_URL}?status=active`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((e) => e.status === 'active')).toBe(true);
  });

  it('searches by name', async () => {
    const res = await request(app).get(`${BASE_URL}?search=Alice`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].first_name).toBe('Alice');
  });
});

describe('GET /employees/:id', () => {
  it('returns the employee when found', async () => {
    const createRes = await request(app).post(BASE_URL).send(validEmployee);
    const id = createRes.body.data.id;

    const res = await request(app).get(`${BASE_URL}/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get(`${BASE_URL}/00000000-0000-4000-a000-000000000000`);
    expect(res.status).toBe(404);
  });

  it('returns 422 for invalid uuid format', async () => {
    const res = await request(app).get(`${BASE_URL}/not-a-uuid`);
    expect(res.status).toBe(422);
  });
});

describe('PUT /employees/:id', () => {
  it('updates employee fields', async () => {
    const createRes = await request(app).post(BASE_URL).send(validEmployee);
    const id = createRes.body.data.id;

    const res = await request(app)
      .put(`${BASE_URL}/${id}`)
      .send({ position: 'Lead Engineer', status: 'active' });

    expect(res.status).toBe(200);
    expect(res.body.data.position).toBe('Lead Engineer');
  });
});

describe('DELETE /employees/:id', () => {
  it('deletes the employee and returns 204', async () => {
    const createRes = await request(app).post(BASE_URL).send(validEmployee);
    const id = createRes.body.data.id;

    const deleteRes = await request(app).delete(`${BASE_URL}/${id}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get(`${BASE_URL}/${id}`);
    expect(getRes.status).toBe(404);
  });
});
