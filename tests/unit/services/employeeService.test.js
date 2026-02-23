// Mock repository before requiring the service
jest.mock('../../../src/data/repositories/employeeRepository');

const employeeService = require('../../../src/business/services/employeeService');
const employeeRepository = require('../../../src/data/repositories/employeeRepository');
const { AppError } = require('../../../src/api/middlewares/errorHandler');

const mockEmployee = {
  id: 'uuid-1',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  department: 'Engineering',
  position: 'Engineer',
  employmentType: 'full_time',
  hireDate: '2022-01-01',
  isActive: true,
  managerId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createEmployee ───────────────────────────────────────────────────────────
describe('createEmployee', () => {
  it('creates an employee when email is unique', async () => {
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.create.mockResolvedValue(mockEmployee);

    const result = await employeeService.createEmployee({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      department: 'Engineering',
      position: 'Engineer',
      hireDate: '2022-01-01',
    });

    expect(result).toEqual(mockEmployee);
    expect(employeeRepository.create).toHaveBeenCalledTimes(1);
  });

  it('throws 409 when email is already registered', async () => {
    employeeRepository.findByEmail.mockResolvedValue(mockEmployee);

    await expect(
      employeeService.createEmployee({ email: 'alice@example.com' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 400 when managerId does not exist', async () => {
    employeeRepository.findByEmail.mockResolvedValue(null);
    employeeRepository.findById.mockResolvedValue(null);

    await expect(
      employeeService.createEmployee({
        email: 'new@example.com',
        managerId: 'nonexistent-uuid',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── getEmployeeById ──────────────────────────────────────────────────────────
describe('getEmployeeById', () => {
  it('returns the employee when found', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    const result = await employeeService.getEmployeeById('uuid-1');
    expect(result).toEqual(mockEmployee);
  });

  it('throws 404 when employee not found', async () => {
    employeeRepository.findById.mockResolvedValue(null);
    await expect(employeeService.getEmployeeById('unknown')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── updateEmployee ───────────────────────────────────────────────────────────
describe('updateEmployee', () => {
  it('updates employee fields', async () => {
    const updated = { ...mockEmployee, position: 'Senior Engineer' };
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.update.mockResolvedValue(updated);

    const result = await employeeService.updateEmployee('uuid-1', { position: 'Senior Engineer' });
    expect(result.position).toBe('Senior Engineer');
  });

  it('throws 409 when new email is already taken', async () => {
    const otherEmployee = { ...mockEmployee, id: 'uuid-2', email: 'other@example.com' };
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.findByEmail.mockResolvedValue(otherEmployee);

    await expect(
      employeeService.updateEmployee('uuid-1', { email: 'other@example.com' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 400 when employee tries to be their own manager', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);

    await expect(
      employeeService.updateEmployee('uuid-1', { managerId: 'uuid-1' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── deactivateEmployee ───────────────────────────────────────────────────────
describe('deactivateEmployee', () => {
  it('deactivates an active employee', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    employeeRepository.update.mockResolvedValue({ ...mockEmployee, isActive: false });

    await employeeService.deactivateEmployee('uuid-1');
    expect(employeeRepository.update).toHaveBeenCalledWith('uuid-1', { isActive: false });
  });

  it('throws 404 when employee not found', async () => {
    employeeRepository.findById.mockResolvedValue(null);
    await expect(employeeService.deactivateEmployee('unknown')).rejects.toMatchObject({ statusCode: 404 });
  });
});
