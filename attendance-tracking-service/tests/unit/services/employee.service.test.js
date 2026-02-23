'use strict';

const employeeService = require('../../../src/services/employee.service');
const employeeRepository = require('../../../src/repositories/employee.repository');

// Mock the repository so tests run without a real database
jest.mock('../../../src/repositories/employee.repository');
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const makeEmployee = (overrides = {}) => ({
  id: 'uuid-1',
  employeeCode: 'EMP-001',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  department: 'Engineering',
  position: 'Developer',
  hireDate: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  toJSON() { return this; },
  ...overrides,
});

describe('EmployeeService', () => {
  afterEach(() => jest.clearAllMocks());

  // ── list ──────────────────────────────────────────────────────────────────
  describe('list()', () => {
    it('returns paginated employee list', async () => {
      employeeRepository.findAll.mockResolvedValue({
        employees: [makeEmployee()],
        total: 1,
      });

      const result = await employeeService.list({ page: 1, limit: 20 });

      expect(result.employees).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────
  describe('getById()', () => {
    it('returns employee when found', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());

      const employee = await employeeService.getById('uuid-1');
      expect(employee.id).toBe('uuid-1');
    });

    it('throws 404 when employee not found', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(employeeService.getById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ── create ────────────────────────────────────────────────────────────────
  describe('create()', () => {
    const newEmployeeData = {
      employee_code: 'EMP-002',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@example.com',
    };

    it('creates employee successfully', async () => {
      employeeRepository.findByCode.mockResolvedValue(null);
      employeeRepository.findByEmail.mockResolvedValue(null);
      employeeRepository.create.mockResolvedValue(
        makeEmployee({ employeeCode: 'EMP-002', firstName: 'John' })
      );

      const result = await employeeService.create(newEmployeeData);
      expect(result.employeeCode).toBe('EMP-002');
      expect(employeeRepository.create).toHaveBeenCalledTimes(1);
    });

    it('throws 409 when employee_code is already taken', async () => {
      employeeRepository.findByCode.mockResolvedValue(makeEmployee());

      await expect(employeeService.create(newEmployeeData)).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('EMP-002'),
      });
    });

    it('throws 409 when email is already registered', async () => {
      employeeRepository.findByCode.mockResolvedValue(null);
      employeeRepository.findByEmail.mockResolvedValue(makeEmployee());

      await expect(employeeService.create(newEmployeeData)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('updates employee successfully', async () => {
      const updated = makeEmployee({ firstName: 'Janet' });
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      employeeRepository.update.mockResolvedValue(updated);

      const result = await employeeService.update('uuid-1', { first_name: 'Janet' });
      expect(result.firstName).toBe('Janet');
    });

    it('throws 404 when employee not found', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(
        employeeService.update('nonexistent', { first_name: 'X' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── deactivate ────────────────────────────────────────────────────────────
  describe('deactivate()', () => {
    it('deactivates employee successfully', async () => {
      employeeRepository.deactivate.mockResolvedValue(true);

      const result = await employeeService.deactivate('uuid-1');
      expect(result.message).toMatch(/deactivated/i);
    });

    it('throws 404 when employee not found', async () => {
      employeeRepository.deactivate.mockResolvedValue(false);

      await expect(employeeService.deactivate('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
