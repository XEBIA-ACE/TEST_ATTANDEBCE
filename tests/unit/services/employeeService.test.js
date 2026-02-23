'use strict';

const employeeService = require('../../../src/services/employeeService');
const employeeRepository = require('../../../src/repositories/employeeRepository');
const { NotFoundError, ConflictError } = require('../../../src/utils/errors');

// Mock the entire repository layer to isolate service logic
jest.mock('../../../src/repositories/employeeRepository');

const mockEmployee = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  employee_code: 'EMP001',
  first_name: 'Alice',
  last_name: 'Johnson',
  email: 'alice@example.com',
  status: 'active',
  department: 'Engineering',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('employeeService.getEmployeeById', () => {
  it('returns the employee when found', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    const result = await employeeService.getEmployeeById(mockEmployee.id);
    expect(result).toEqual(mockEmployee);
    expect(employeeRepository.findById).toHaveBeenCalledWith(mockEmployee.id);
  });

  it('throws NotFoundError when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);
    await expect(employeeService.getEmployeeById('nonexistent-id')).rejects.toThrow(NotFoundError);
  });
});

describe('employeeService.createEmployee', () => {
  const newEmployee = {
    employee_code: 'EMP005',
    first_name: 'Dave',
    last_name: 'Brown',
    email: 'dave@example.com',
  };

  it('creates an employee when no conflicts exist', async () => {
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.findByEmployeeCode.mockResolvedValue(null);
    employeeRepository.create.mockResolvedValue({ id: 'new-id', ...newEmployee });

    const result = await employeeService.createEmployee(newEmployee);
    expect(result.id).toBe('new-id');
    expect(employeeRepository.create).toHaveBeenCalledWith(newEmployee);
  });

  it('throws ConflictError for duplicate email', async () => {
    employeeRepository.findByEmail.mockResolvedValue(mockEmployee);
    employeeRepository.findByEmployeeCode.mockResolvedValue(null);

    await expect(employeeService.createEmployee(newEmployee)).rejects.toThrow(ConflictError);
    expect(employeeRepository.create).not.toHaveBeenCalled();
  });

  it('throws ConflictError for duplicate employee_code', async () => {
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.findByEmployeeCode.mockResolvedValue(mockEmployee);

    await expect(employeeService.createEmployee(newEmployee)).rejects.toThrow(ConflictError);
    expect(employeeRepository.create).not.toHaveBeenCalled();
  });
});

describe('employeeService.updateEmployee', () => {
  it('updates successfully when employee exists and no conflicts', async () => {
    const updated = { ...mockEmployee, position: 'Lead Engineer' };
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.findByEmployeeCode.mockResolvedValue(null);
    employeeRepository.update.mockResolvedValue(updated);

    const result = await employeeService.updateEmployee(mockEmployee.id, { position: 'Lead Engineer' });
    expect(result.position).toBe('Lead Engineer');
  });

  it('throws NotFoundError when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);
    await expect(
      employeeService.updateEmployee('bad-id', { position: 'Manager' })
    ).rejects.toThrow(NotFoundError);
  });
});

describe('employeeService.deleteEmployee', () => {
  it('deletes successfully when employee exists', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.delete.mockResolvedValue(1);

    await employeeService.deleteEmployee(mockEmployee.id);
    expect(employeeRepository.delete).toHaveBeenCalledWith(mockEmployee.id);
  });

  it('throws NotFoundError when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);
    await expect(employeeService.deleteEmployee('bad-id')).rejects.toThrow(NotFoundError);
  });
});
