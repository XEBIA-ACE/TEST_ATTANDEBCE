'use strict';

const EmployeeService = require('../../../src/domain/services/employeeService');
const Employee = require('../../../src/domain/models/Employee');
const AppError = require('../../../src/utils/AppError');

// Mock the repository to isolate service logic
const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  isEmployeeNumberTaken: jest.fn(),
  isEmailTaken: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const sampleEmployee = new Employee({
  id: 'abc-123',
  employee_number: 'EMP001',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  department: 'Engineering',
  position: 'Developer',
  status: 'active',
  hire_date: '2023-01-01',
  created_at: new Date(),
  updated_at: new Date(),
});

describe('EmployeeService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmployeeService(mockRepo);
  });

  // ── listEmployees ────────────────────────────────────────────────────────────

  describe('listEmployees', () => {
    it('should return paginated employees', async () => {
      const mockResult = { data: [sampleEmployee], total: 1, page: 1, limit: 20 };
      mockRepo.findAll.mockResolvedValue(mockResult);

      const result = await service.listEmployees({ page: 1, limit: 20 });

      expect(mockRepo.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should clamp limit to max 100', async () => {
      mockRepo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 100 });

      await service.listEmployees({ page: 1, limit: 9999 });

      expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });

    it('should default page to 1 for invalid input', async () => {
      mockRepo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

      await service.listEmployees({ page: -5 });

      expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });
  });

  // ── createEmployee ───────────────────────────────────────────────────────────

  describe('createEmployee', () => {
    const newEmployeeData = {
      employee_number: 'EMP002',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      department: 'HR',
      position: 'Manager',
      hire_date: '2023-06-01',
    };

    it('should create employee when number and email are unique', async () => {
      mockRepo.isEmployeeNumberTaken.mockResolvedValue(false);
      mockRepo.isEmailTaken.mockResolvedValue(false);
      mockRepo.create.mockResolvedValue(sampleEmployee);

      const result = await service.createEmployee(newEmployeeData);

      expect(mockRepo.isEmployeeNumberTaken).toHaveBeenCalledWith('EMP002');
      expect(mockRepo.isEmailTaken).toHaveBeenCalledWith('jane.smith@example.com');
      expect(mockRepo.create).toHaveBeenCalledWith(newEmployeeData);
      expect(result).toBe(sampleEmployee);
    });

    it('should throw conflict error if employee number is taken', async () => {
      mockRepo.isEmployeeNumberTaken.mockResolvedValue(true);

      await expect(service.createEmployee(newEmployeeData)).rejects.toThrow(AppError);
      await expect(service.createEmployee(newEmployeeData)).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should throw conflict error if email is taken', async () => {
      mockRepo.isEmployeeNumberTaken.mockResolvedValue(false);
      mockRepo.isEmailTaken.mockResolvedValue(true);

      await expect(service.createEmployee(newEmployeeData)).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  // ── updateEmployee ───────────────────────────────────────────────────────────

  describe('updateEmployee', () => {
    it('should update employee successfully', async () => {
      mockRepo.findById.mockResolvedValue(sampleEmployee);
      mockRepo.isEmailTaken.mockResolvedValue(false);
      mockRepo.update.mockResolvedValue({ ...sampleEmployee, position: 'Senior Developer' });

      await service.updateEmployee('abc-123', { position: 'Senior Developer' });

      expect(mockRepo.update).toHaveBeenCalledWith('abc-123', { position: 'Senior Developer' });
    });

    it('should throw 404 if employee does not exist', async () => {
      mockRepo.findById.mockRejectedValue(AppError.notFound('Employee not found'));

      await expect(service.updateEmployee('nonexistent', { position: 'X' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ── deleteEmployee ───────────────────────────────────────────────────────────

  describe('deleteEmployee', () => {
    it('should soft-delete employee', async () => {
      mockRepo.delete.mockResolvedValue(true);

      const result = await service.deleteEmployee('abc-123');

      expect(mockRepo.delete).toHaveBeenCalledWith('abc-123');
      expect(result.message).toContain('deleted');
    });
  });
});
