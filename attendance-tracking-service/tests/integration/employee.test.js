'use strict';

/**
 * Integration tests for the Employee API endpoints.
 *
 * These tests start the Express app and use supertest to fire real HTTP
 * requests. They mock the repository layer so no real database is needed.
 *
 * To run against a real database, remove the jest.mock calls and ensure
 * a test database is available via DB_* environment variables.
 */

const request = require('supertest');
const app = require('../../src/app');
const employeeRepository = require('../../src/repositories/employee.repository');

jest.mock('../../src/repositories/employee.repository');
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Generate a valid JWT for tests (bypass real auth)
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test_secret_key_at_least_32_chars_long!!';

const adminToken = jwt.sign(
  { sub: 'user-1', email: 'admin@test.com', role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const makeDbEmployee = (overrides = {}) => ({
  id: 'uuid-emp-1',
  employee_code: 'EMP-001',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  department: 'Engineering',
  position: 'Developer',
  hire_date: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
  toJSON() {
    return {
      id: this.id,
      employee_code: this.employee_code,
      first_name: this.first_name,
      last_name: this.last_name,
      full_name: `${this.first_name} ${this.last_name}`,
      email: this.email,
      department: this.department,
      position: this.position,
      hire_date: this.hire_date,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  },
});

describe('Employee API', () => {
  afterEach(() => jest.clearAllMocks());

  // ── GET /api/v1/employees ─────────────────────────────────────────────────
  describe('GET /api/v1/employees', () => {
    it('returns 200 with paginated employee list', async () => {
      employeeRepository.findAll.mockResolvedValue({
        employees: [makeDbEmployee()],
        total: 1,
      });

      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employees).toHaveLength(1);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/v1/employees');
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/v1/employees/:id ─────────────────────────────────────────────
  describe('GET /api/v1/employees/:id', () => {
    it('returns 200 with the employee', async () => {
      employeeRepository.findById.mockResolvedValue(makeDbEmployee());

      const res = await request(app)
        .get('/api/v1/employees/uuid-emp-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('uuid-emp-1');
    });

    it('returns 404 when not found', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/employees/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/v1/employees ────────────────────────────────────────────────
  describe('POST /api/v1/employees', () => {
    const payload = {
      employee_code: 'EMP-002',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@example.com',
      department: 'HR',
    };

    it('creates an employee and returns 201', async () => {
      employeeRepository.findByCode.mockResolvedValue(null);
      employeeRepository.findByEmail.mockResolvedValue(null);
      employeeRepository.create.mockResolvedValue(
        makeDbEmployee({ id: 'uuid-emp-2', employee_code: 'EMP-002' })
      );

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.employee_code).toBe('EMP-002');
    });

    it('returns 422 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ first_name: 'Only name' });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 409 when employee_code is duplicate', async () => {
      employeeRepository.findByCode.mockResolvedValue(makeDbEmployee());

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(409);
    });
  });

  // ── PATCH /api/v1/employees/:id ───────────────────────────────────────────
  describe('PATCH /api/v1/employees/:id', () => {
    it('updates an employee and returns 200', async () => {
      employeeRepository.findById.mockResolvedValue(makeDbEmployee());
      employeeRepository.update.mockResolvedValue(
        makeDbEmployee({ first_name: 'Janet' })
      );

      const res = await request(app)
        .patch('/api/v1/employees/uuid-emp-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ first_name: 'Janet' });

      expect(res.status).toBe(200);
      expect(res.body.data.first_name).toBe('Janet');
    });
  });
});
