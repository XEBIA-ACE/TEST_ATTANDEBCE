const employeeService = require('../../../src/services/employee.service');
const employeeRepository = require('../../../src/repositories/employee.repository');
const { NotFoundError, ConflictError } = require('../../../src/utils/errors');

// Mock the repository so tests don't need a database
jest.mock('../../../src/repositories/employee.repository');

const mockEmployee = {
  id: 'emp-uuid-1',
  employeeNumber: 'EMP-0001',
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'alice@example.com',
  isActive: true,
  toJSON() { return this; },
};

describe('EmployeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listEmployees', () => {
    it('returns count and mapped employees', async () => {
      employeeRepository.findAll.mockResolvedValue({ count: 1, rows: [mockEmployee] });
      const result = await employeeService.listEmployees({ page: 1, limit: 20 });
      expect(result.count).toBe(1);
      expect(result.employees[0].email).toBe('alice@example.com');
    });
  });

  describe('getEmployee', () => {
    it('returns employee when found', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      const emp = await employeeService.getEmployee('emp-uuid-1');
      expect(emp.id).toBe('emp-uuid-1');
    });

    it('throws NotFoundError when not found', async () => {
      employeeRepository.findById.mockResolvedValue(null);
      await expect(employeeService.getEmployee('bad-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createEmployee', () => {
    const payload = {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      hireDate: '2024-01-01',
    };

    it('creates and returns new employee', async () => {
      employeeRepository.findByEmail.mockResolvedValue(null);
      employeeRepository.create.mockResolvedValue({ ...payload, id: 'new-id', toJSON() { return this; } });
      const emp = await employeeService.createEmployee(payload);
      expect(emp.email).toBe('bob@example.com');
    });

    it('throws ConflictError when email already exists', async () => {
      employeeRepository.findByEmail.mockResolvedValue(mockEmployee);
      await expect(employeeService.createEmployee(payload)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateEmployee', () => {
    it('updates and returns the employee', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      const updated = { ...mockEmployee, firstName: 'Alicia', toJSON() { return this; } };
      employeeRepository.update.mockResolvedValue(updated);
      employeeRepository.findByEmail.mockResolvedValue(null);
      const result = await employeeService.updateEmployee('emp-uuid-1', { firstName: 'Alicia' });
      expect(result.firstName).toBe('Alicia');
    });

    it('throws NotFoundError when employee missing', async () => {
      employeeRepository.findById.mockResolvedValue(null);
      await expect(
        employeeService.updateEmployee('bad-id', { firstName: 'X' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteEmployee', () => {
    it('returns void on success', async () => {
      employeeRepository.delete.mockResolvedValue(true);
      await expect(employeeService.deleteEmployee('emp-uuid-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundError when employee missing', async () => {
      employeeRepository.delete.mockResolvedValue(false);
      await expect(employeeService.deleteEmployee('bad-id')).rejects.toThrow(NotFoundError);
    });
  });
});
