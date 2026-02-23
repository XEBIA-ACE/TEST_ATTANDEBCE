const employeeService = require('../../../src/domain/services/employeeService');
const employeeRepository = require('../../../src/infrastructure/repositories/employeeRepository');
const Employee = require('../../../src/domain/models/Employee');

// Mock the repository so unit tests have no database dependency
jest.mock('../../../src/infrastructure/repositories/employeeRepository');

const mockEmployeeData = {
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
};

describe('EmployeeService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getEmployeeById', () => {
    it('returns an Employee when found', async () => {
      employeeRepository.findById.mockResolvedValue(Employee.fromDB(mockEmployeeData));

      const result = await employeeService.getEmployeeById(mockEmployeeData.id);

      expect(employeeRepository.findById).toHaveBeenCalledWith(mockEmployeeData.id);
      expect(result).toBeInstanceOf(Employee);
      expect(result.email).toBe('alice@example.com');
    });

    it('throws 404 when employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(employeeService.getEmployeeById('non-existent-id')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Employee not found',
      });
    });
  });

  describe('createEmployee', () => {
    const newEmployeeData = {
      first_name: 'Bob',
      last_name: 'Smith',
      email: 'bob@example.com',
      department: 'Engineering',
    };

    it('creates and returns a new employee', async () => {
      employeeRepository.findByEmail.mockResolvedValue(null);
      employeeRepository.findByEmployeeCode.mockResolvedValue(null);
      employeeRepository.findAll.mockResolvedValue({ data: [] });
      employeeRepository.create.mockResolvedValue(
        Employee.fromDB({ ...mockEmployeeData, ...newEmployeeData })
      );

      const result = await employeeService.createEmployee(newEmployeeData);

      expect(employeeRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Employee);
    });

    it('throws 409 when email is already in use', async () => {
      employeeRepository.findByEmail.mockResolvedValue(Employee.fromDB(mockEmployeeData));

      await expect(employeeService.createEmployee(newEmployeeData)).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(employeeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteEmployee', () => {
    it('soft-deletes an existing employee', async () => {
      employeeRepository.delete.mockResolvedValue(true);
      await expect(employeeService.deleteEmployee(mockEmployeeData.id)).resolves.toBeUndefined();
    });

    it('throws 404 when employee does not exist', async () => {
      employeeRepository.delete.mockResolvedValue(false);
      await expect(employeeService.deleteEmployee('ghost-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
