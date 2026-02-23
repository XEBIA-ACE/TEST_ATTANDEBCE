/**
 * Unit tests for EmployeeService.
 */

const EmployeeService = require('../../src/services/employee.service');
const { NotFoundError, ConflictError } = require('../../src/utils/errors');

jest.mock('../../src/repositories/employee.repository');
const EmployeeRepository = require('../../src/repositories/employee.repository');

const mockEmployee = {
  id: 'uuid-1',
  employee_code: 'EMP-001',
  first_name: 'John',
  last_name: 'Smith',
  email: 'john.smith@example.com',
  department: 'Engineering',
  position: 'Developer',
  status: 'active',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('EmployeeService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    EmployeeRepository.mockImplementation(() => mockRepo);
    service = new EmployeeService();
  });

  describe('listEmployees', () => {
    it('returns paginated list of employees', async () => {
      mockRepo.findAll.mockResolvedValue({ rows: [mockEmployee], total: 1 });

      const result = await service.listEmployees({ page: '1', limit: '10' });

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toMatchObject({ page: 1, limit: 10, total: 1 });
    });

    it('passes filter params to repository', async () => {
      mockRepo.findAll.mockResolvedValue({ rows: [], total: 0 });

      await service.listEmployees({ status: 'active', department: 'Engineering' });

      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', department: 'Engineering' })
      );
    });
  });

  describe('getEmployee', () => {
    it('returns the employee when found', async () => {
      mockRepo.findById.mockResolvedValue(mockEmployee);

      const result = await service.getEmployee('uuid-1');
      expect(result).toEqual(mockEmployee);
    });

    it('propagates NotFoundError when employee does not exist', async () => {
      mockRepo.findById.mockRejectedValue(new NotFoundError('Employee'));

      await expect(service.getEmployee('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createEmployee', () => {
    it('creates and returns a new employee', async () => {
      const input = {
        employee_code: 'EMP-002',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      };

      mockRepo.create.mockResolvedValue({ ...mockEmployee, ...input, id: 'uuid-2' });

      const result = await service.createEmployee(input);
      expect(result.email).toBe('jane@example.com');
      expect(mockRepo.create).toHaveBeenCalledWith(input);
    });
  });

  describe('updateEmployee', () => {
    it('updates and returns the modified employee', async () => {
      const updates = { department: 'Product' };
      mockRepo.update.mockResolvedValue({ ...mockEmployee, ...updates });

      const result = await service.updateEmployee('uuid-1', updates);
      expect(result.department).toBe('Product');
    });
  });

  describe('deleteEmployee', () => {
    it('delegates deletion to repository and returns confirmation', async () => {
      mockRepo.delete.mockResolvedValue({ id: 'uuid-1', deleted: true });

      const result = await service.deleteEmployee('uuid-1');
      expect(result.deleted).toBe(true);
    });
  });
});
