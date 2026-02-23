'use strict';

/**
 * Integration tests for the Employee API endpoints.
 *
 * These tests run against a real (test) database.
 * Requires a running PostgreSQL instance configured via .env.test or environment variables.
 *
 * Run with: NODE_ENV=test jest tests/integration
 */

const request = require('supertest');
const app = require('../../src/app');
const { getDb, closeDb } = require('../../src/config/database');
const { generateToken } = require('../../src/api/middlewares/auth');

// Generate a valid JWT for authenticated requests
const authToken = generateToken({ id: 'test-user', role: 'admin' });
const authHeader = `Bearer ${authToken}`;

let db;

beforeAll(async () => {
  db = getDb();
  // Run migrations on test database
  await db.migrate.latest();
});

afterAll(async () => {
  // Clean up and close connection
  await db.migrate.rollback(undefined, true);
  await closeDb();
});

beforeEach(async () => {
  // Clean tables between tests
  await db('attendance_records').del();
  await db('employees').del();
});

// ── Helper ───────────────────────────────────────────────────────────────────

async function createEmployee(overrides = {}) {
  const data = {
    employee_number: 'EMP001',
    first_name: 'Test',
    last_name: 'User',
    email: 'test.user@example.com',
    department: 'Engineering',
    position: 'Developer',
    hire_date: '2023-01-01',
    ...overrides,
  };
  const res = await request(app)
    .post('/api/v1/employees')
    .set('Authorization', authHeader)
    .send(data);
  return res.body.data;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Employee API', () => {
  describe('POST /api/v1/employees', () => {
    it('should create a new employee and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', authHeader)
        .send({
          employee_number: 'EMP001',
          first_name: 'Alice',
          last_name: 'Smith',
          email: 'alice.smith@example.com',
          department: 'Engineering',
          position: 'Engineer',
          hire_date: '2023-01-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        employee_number: 'EMP001',
        first_name: 'Alice',
        email: 'alice.smith@example.com',
      });
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', authHeader)
        .send({ first_name: 'Alice' }); // missing required fields

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', authHeader)
        .send({
          employee_number: 'EMP001',
          first_name: 'Alice',
          last_name: 'Smith',
          email: 'not-an-email',
          department: 'Engineering',
          position: 'Engineer',
          hire_date: '2023-01-15',
        });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate employee number', async () => {
      await createEmployee({ employee_number: 'EMP001' });

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', authHeader)
        .send({
          employee_number: 'EMP001', // Duplicate
          first_name: 'Bob',
          last_name: 'Jones',
          email: 'bob.jones@example.com',
          department: 'HR',
          position: 'Manager',
          hire_date: '2023-05-01',
        });

      expect(res.status).toBe(409);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/api/v1/employees').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/employees', () => {
    it('should return paginated list of employees', async () => {
      await createEmployee({ employee_number: 'EMP001', email: 'e1@test.com' });
      await createEmployee({ employee_number: 'EMP002', email: 'e2@test.com' });

      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({ total: 2, page: 1 });
    });

    it('should support status filtering', async () => {
      await createEmployee({ employee_number: 'EMP001', email: 'e1@test.com', status: 'active' });
      await createEmployee({ employee_number: 'EMP002', email: 'e2@test.com', status: 'inactive' });

      const res = await request(app)
        .get('/api/v1/employees?status=inactive')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('inactive');
    });
  });

  describe('GET /api/v1/employees/:id', () => {
    it('should return employee by ID', async () => {
      const created = await createEmployee();

      const res = await request(app)
        .get(`/api/v1/employees/${created.id}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(created.id);
    });

    it('should return 404 for nonexistent ID', async () => {
      const res = await request(app)
        .get('/api/v1/employees/00000000-0000-0000-0000-000000000000')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/employees/:id', () => {
    it('should update employee fields', async () => {
      const created = await createEmployee();

      const res = await request(app)
        .patch(`/api/v1/employees/${created.id}`)
        .set('Authorization', authHeader)
        .send({ position: 'Senior Developer', department: 'Platform' });

      expect(res.status).toBe(200);
      expect(res.body.data.position).toBe('Senior Developer');
      expect(res.body.data.department).toBe('Platform');
    });
  });

  describe('DELETE /api/v1/employees/:id', () => {
    it('should soft-delete an employee', async () => {
      const created = await createEmployee();

      const res = await request(app)
        .delete(`/api/v1/employees/${created.id}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft-deleted employee is not visible in list
      const listRes = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', authHeader);
      expect(listRes.body.data).toHaveLength(0);
    });
  });
});
