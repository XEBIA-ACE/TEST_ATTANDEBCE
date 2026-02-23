/**
 * Integration tests for the Employee API routes.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const { app } = require('../../src/app');
const { getDatabase, runMigrations, closeDatabase } = require('../../src/config/database');
const { generateToken } = require('../../src/api/middleware/auth.middleware');

const adminToken = generateToken({ id: 'admin-1', role: 'admin' });
const managerToken = generateToken({ id: 'mgr-1', role: 'manager' });

let db;

beforeAll(async () => {
  await runMigrations();
  db = getDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await db('employees').delete();
});

const validEmployee = {
  employee_code: 'EMP-001',
  first_name: 'Alice',
  last_name: 'Wonder',
  email: 'alice@example.com',
  department: 'Engineering',
  position: 'Engineer',
  status: 'active',
};

describe('POST /api/v1/employees', () => {
  it('creates an employee and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validEmployee);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('alice@example.com');
    expect(res.body.data.id).toBeTruthy();
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ first_name: 'Alice' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 on duplicate email', async () => {
    await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validEmployee);

    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEmployee, employee_code: 'EMP-002' });

    expect(res.status).toBe(409);
  });

  it('returns 403 for employee role creating a user', async () => {
    const empToken = generateToken({ id: 'u1', role: 'employee' });
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${empToken}`)
      .send(validEmployee);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/employees', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validEmployee);
  });

  it('returns a paginated list', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/v1/employees?status=active')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((e) => expect(e.status).toBe('active'));
  });
});

describe('GET /api/v1/employees/:id', () => {
  it('returns 404 for nonexistent employee', async () => {
    const res = await request(app)
      .get('/api/v1/employees/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/employees/:id', () => {
  it('updates an employee successfully', async () => {
    const createRes = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validEmployee);

    const id = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/employees/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ department: 'Product' });

    expect(res.status).toBe(200);
    expect(res.body.data.department).toBe('Product');
  });
});
