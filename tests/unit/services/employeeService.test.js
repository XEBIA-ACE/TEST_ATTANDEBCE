'use strict';

jest.mock('../../../src/repositories/employeeRepository');

const employeeService = require('../../../src/services/employeeService');
const employeeRepository = require('../../../src/repositories/employeeRepository');
const { NotFoundError, ConflictError } = require('../../../src/utils/errors');

const mockEmployee = {
  id: 'emp-uuid-1',
  employee_code: 'EMP-001',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  status: 'active',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('EmployeeService.getEmployee', () => {
  it('returns an employee when found', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);

    const result = await employeeService.getEmployee(mockEmployee.id);
    expect(result).toEqual(mockEmployee);
    expect(employeeRepository.findById).toHaveBeenCalledWith(mockEmployee.id);
  });

  it('throws NotFoundError when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);

    await expect(employeeService.getEmployee('nonexistent-id')).rejects.toThrow(NotFoundError);
  });
});

describe('EmployeeService.createEmployee', () => {
  it('creates an employee when email and code are unique', async () => {
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.findByCode.mockResolvedValue(null);
    employeeRepository.create.mockResolvedValue(mockEmployee);

    const result = await employeeService.createEmployee({
      employee_code: 'EMP-001',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
    });

    expect(employeeRepository.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockEmployee);
  });

  it('throws ConflictError when email already exists', async () => {
    employeeRepository.findByEmail.mockResolvedValue(mockEmployee);
    employeeRepository.findByCode.mockResolvedValue(null);

    await expect(
      employeeService.createEmployee({ email: 'jane@example.com', employee_code: 'EMP-099' })
    ).rejects.toThrow(ConflictError);

    expect(employeeRepository.create).not.toHaveBeenCalled();
  });

  it('throws ConflictError when employee_code is already in use', async () => {
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.findByCode.mockResolvedValue(mockEmployee);

    await expect(
      employeeService.createEmployee({ email: 'new@example.com', employee_code: 'EMP-001' })
    ).rejects.toThrow(ConflictError);
  });

  it('hashes the password before storing', async () => {
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.findByCode.mockResolvedValue(null);
    employeeRepository.create.mockImplementation((data) => Promise.resolve(data));

    await employeeService.createEmployee({
      employee_code: 'EMP-002',
      email: 'new@example.com',
      password: 'PlainText123!',
    });

    const createArg = employeeRepository.create.mock.calls[0][0];
    expect(createArg.password).toBeUndefined();
    expect(createArg.password_hash).toBeDefined();
    expect(createArg.password_hash).not.toBe('PlainText123!');
  });
});

describe('EmployeeService.updateEmployee', () => {
  it('updates the employee successfully', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.update.mockResolvedValue({ ...mockEmployee, first_name: 'Updated' });

    const result = await employeeService.updateEmployee(mockEmployee.id, { first_name: 'Updated' });
    expect(result.first_name).toBe('Updated');
  });

  it('throws NotFoundError when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);

    await expect(employeeService.updateEmployee('unknown', { first_name: 'X' })).rejects.toThrow(
      NotFoundError
    );
  });

  it('allows updating email to the same value (no conflict)', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.update.mockResolvedValue(mockEmployee);

    // Same email should not trigger uniqueness check
    await expect(
      employeeService.updateEmployee(mockEmployee.id, { email: mockEmployee.email })
    ).resolves.not.toThrow();
    expect(employeeRepository.findByEmail).not.toHaveBeenCalled();
  });
});

describe('EmployeeService.deleteEmployee', () => {
  it('deactivates the employee by default (soft delete)', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.update.mockResolvedValue({ ...mockEmployee, status: 'inactive' });

    await employeeService.deleteEmployee(mockEmployee.id);

    expect(employeeRepository.update).toHaveBeenCalledWith(mockEmployee.id, { status: 'inactive' });
    expect(employeeRepository.delete).not.toHaveBeenCalled();
  });

  it('hard-deletes the employee when force=true', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.delete.mockResolvedValue(true);

    await employeeService.deleteEmployee(mockEmployee.id, { force: true });

    expect(employeeRepository.delete).toHaveBeenCalledWith(mockEmployee.id);
    expect(employeeRepository.update).not.toHaveBeenCalled();
  });
});
