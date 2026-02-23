'use strict';

require('../../setup');

const employeeService = require('../../../src/business/services/employee.service');
const employeeRepository = require('../../../src/data/repositories/employee.repository');
const AppError = require('../../../src/utils/app.error');

// Mock the repository so unit tests don't touch the database
jest.mock('../../../src/data/repositories/employee.repository');

describe('EmployeeService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── getEmployee ──────────────────────────────────────────────────────────────
  describe('getEmployee()', () => {
    it('returns the employee when found', async () => {
      const mockEmployee = { id: 'uuid-1', firstName: 'Alice', toJSON: () => ({}) };
      employeeRepository.findById.mockResolvedValue(mockEmployee);

      const result = await employeeService.getEmployee('uuid-1');
      expect(result).toBe(mockEmployee);
      expect(employeeRepository.findById).toHaveBeenCalledWith('uuid-1');
    });

    it('throws 404 AppError when employee is not found', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(employeeService.getEmployee('uuid-x')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Employee not found',
      });
    });
  });

  // ── createEmployee ───────────────────────────────────────────────────────────
  describe('createEmployee()', () => {
    const validData = {
      employeeCode: 'EMP-001',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      password: 'Password123!',
    };

    it('creates an employee successfully', async () => {
      employeeRepository.existsBy.mockResolvedValue(false);
      const mockEmployee = { id: 'uuid-new', ...validData };
      employeeRepository.create.mockResolvedValue(mockEmployee);

      const result = await employeeService.createEmployee(validData);
      expect(result).toBe(mockEmployee);
      expect(employeeRepository.create).toHaveBeenCalledTimes(1);
    });

    it('throws 409 when employeeCode already exists', async () => {
      employeeRepository.existsBy.mockImplementation((field) =>
        Promise.resolve(field === 'employeeCode')
      );

      await expect(employeeService.createEmployee(validData)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('throws 409 when email already exists', async () => {
      employeeRepository.existsBy.mockImplementation((field) =>
        Promise.resolve(field === 'email')
      );

      await expect(employeeService.createEmployee(validData)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  // ── deleteEmployee ───────────────────────────────────────────────────────────
  describe('deleteEmployee()', () => {
    it('soft-deletes an existing employee', async () => {
      const mockEmployee = { id: 'uuid-1' };
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      employeeRepository.delete.mockResolvedValue(true);

      await expect(employeeService.deleteEmployee('uuid-1')).resolves.toBe(true);
    });

    it('throws 404 if employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(employeeService.deleteEmployee('uuid-x')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
