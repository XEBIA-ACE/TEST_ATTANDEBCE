/**
 * Integration tests for the /api/v1/employees endpoints.
 * The repository is mocked so no real database is required.
 */
const request = require('supertest');

jest.mock('../../src/database/connection', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(true),
  },
  connectDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/models', () => ({
  sequelize: { authenticate: jest.fn(), query: jest.fn() },
  Department: {},
  Employee: {},
  AttendanceRecord: {},
}));

// Mock the service layer (not the repo) to keep tests focused on HTTP behaviour
jest.mock('../../src/services/employee.service', () => ({
  listEmployees: jest.fn(),
  getEmployee: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
}));

const app = require('../../src/app');
const employeeService = require('../../src/services/employee.service');
const { NotFoundError, ConflictError } = require('../../src/utils/errors');

const sampleEmployee = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  employeeNumber: 'EMP-0001',
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'alice@example.com',
  isActive: true,
};

describe('Employees API', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── GET /api/v1/employees ─────────────────────────────────────────────────
  describe('GET /api/v1/employees', () => {
    it('returns paginated list', async () => {
      employeeService.listEmployees.mockResolvedValue({
        count: 1,
        employees: [sampleEmployee],
      });
      const res = await request(app).get('/api/v1/employees');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('validates query params — rejects invalid limit', async () => {
      const res = await request(app).get('/api/v1/employees?limit=abc');
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/v1/employees/:id ─────────────────────────────────────────────
  describe('GET /api/v1/employees/:id', () => {
    it('returns employee when found', async () => {
      employeeService.getEmployee.mockResolvedValue(sampleEmployee);
      const res = await request(app).get(`/api/v1/employees/${sampleEmployee.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('alice@example.com');
    });

    it('returns 404 when not found', async () => {
      employeeService.getEmployee.mockRejectedValue(new NotFoundError('Employee'));
      const res = await request(app).get('/api/v1/employees/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ── POST /api/v1/employees ────────────────────────────────────────────────
  describe('POST /api/v1/employees', () => {
    const payload = {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      hireDate: '2024-01-15',
    };

    it('creates employee and returns 201', async () => {
      employeeService.createEmployee.mockResolvedValue({ ...payload, id: 'new-uuid' });
      const res = await request(app).post('/api/v1/employees').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('bob@example.com');
    });

    it('returns 422 for missing required fields', async () => {
      const res = await request(app).post('/api/v1/employees').send({ firstName: 'Incomplete' });
      expect(res.status).toBe(422);
    });

    it('returns 409 on duplicate email', async () => {
      employeeService.createEmployee.mockRejectedValue(new ConflictError('Email in use'));
      const res = await request(app).post('/api/v1/employees').send(payload);
      expect(res.status).toBe(409);
    });
  });

  // ── PATCH /api/v1/employees/:id ───────────────────────────────────────────
  describe('PATCH /api/v1/employees/:id', () => {
    it('updates employee', async () => {
      employeeService.updateEmployee.mockResolvedValue({ ...sampleEmployee, firstName: 'Alicia' });
      const res = await request(app)
        .patch(`/api/v1/employees/${sampleEmployee.id}`)
        .send({ firstName: 'Alicia' });
      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Alicia');
    });

    it('returns 422 for empty body', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${sampleEmployee.id}`)
        .send({});
      expect(res.status).toBe(422);
    });
  });

  // ── DELETE /api/v1/employees/:id ──────────────────────────────────────────
  describe('DELETE /api/v1/employees/:id', () => {
    it('returns 204 on success', async () => {
      employeeService.deleteEmployee.mockResolvedValue();
      const res = await request(app).delete(`/api/v1/employees/${sampleEmployee.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 when not found', async () => {
      employeeService.deleteEmployee.mockRejectedValue(new NotFoundError('Employee'));
      const res = await request(app).delete('/api/v1/employees/bad-id');
      expect(res.status).toBe(404);
    });
  });
});
