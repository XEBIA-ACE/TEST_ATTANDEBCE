/**
 * Integration tests for the /api/v1/employees endpoints.
 *
 * These tests hit the actual Express app with a mocked service layer.
 * For full end-to-end tests, swap mocks for a real test database.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const employeeService = require('../../src/domain/services/employeeService');
const Employee = require('../../src/domain/models/Employee');

jest.mock('../../src/domain/services/employeeService');

// Generate a valid JWT for all test requests
const authToken = jwt.sign(
  { id: 'test-user', role: 'admin' },
  process.env.JWT_SECRET || 'test-secret-key',
  { expiresIn: '1h' }
);

const mockEmployee = Employee.fromDB({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  employee_code: 'EMP-0001',
  first_name: 'Alice',
  last_name: 'Johnson',
  email: 'alice@example.com',
  department: 'Engineering',
  position: 'Engineer',
  status: 'active',
  hire_date: '2022-01-01',
  created_at: new Date(),
  updated_at: new Date(),
});

describe('GET /api/v1/employees', () => {
  it('returns paginated employee list with 200', async () => {
    employeeService.getAllEmployees.mockResolvedValue({
      data: [mockEmployee],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const res = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/employees');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/employees/:id', () => {
  it('returns 200 with an employee when found', async () => {
    employeeService.getEmployeeById.mockResolvedValue(mockEmployee);

    const res = await request(app)
      .get(`/api/v1/employees/${mockEmployee.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(mockEmployee.id);
  });

  it('returns 404 when employee is not found', async () => {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    employeeService.getEmployeeById.mockRejectedValue(err);

    const res = await request(app)
      .get('/api/v1/employees/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/employees', () => {
  it('creates an employee and returns 201', async () => {
    employeeService.createEmployee.mockResolvedValue(mockEmployee);

    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        department: 'Engineering',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 422 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ first_name: 'Alice' }); // missing last_name and email

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

describe('DELETE /api/v1/employees/:id', () => {
  it('soft-deletes an employee and returns 200', async () => {
    employeeService.deleteEmployee.mockResolvedValue();

    const res = await request(app)
      .delete(`/api/v1/employees/${mockEmployee.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
