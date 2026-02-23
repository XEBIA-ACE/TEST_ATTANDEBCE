/**
 * Unit tests for AttendanceService.
 * Dependencies (repositories) are mocked so tests run without a real DB.
 */

const AttendanceService = require('../../src/services/attendance.service');
const { ConflictError, NotFoundError, ValidationError } = require('../../src/utils/errors');

// Mock entire repository modules
jest.mock('../../src/repositories/attendance.repository');
jest.mock('../../src/repositories/employee.repository');

const AttendanceRepository = require('../../src/repositories/attendance.repository');
const EmployeeRepository = require('../../src/repositories/employee.repository');

const mockEmployee = {
  id: 'emp-uuid-1',
  employee_code: 'EMP-001',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  status: 'active',
};

const mockRecord = {
  id: 'att-uuid-1',
  employee_id: 'emp-uuid-1',
  date: new Date().toISOString().split('T')[0],
  check_in: new Date().toISOString(),
  check_out: null,
  status: 'present',
  total_hours: null,
};

describe('AttendanceService', () => {
  let service;
  let mockAttendanceRepo;
  let mockEmployeeRepo;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock instances
    mockAttendanceRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmployeeAndDate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getSummary: jest.fn(),
    };

    mockEmployeeRepo = {
      findById: jest.fn(),
    };

    AttendanceRepository.mockImplementation(() => mockAttendanceRepo);
    EmployeeRepository.mockImplementation(() => mockEmployeeRepo);

    service = new AttendanceService();
  });

  // ─── checkIn ─────────────────────────────────────────────────────────────────
  describe('checkIn', () => {
    it('creates a new attendance record on successful check-in', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);
      mockAttendanceRepo.create.mockResolvedValue({ ...mockRecord });

      const result = await service.checkIn('emp-uuid-1', { notes: 'Remote' });

      expect(mockAttendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employee_id: 'emp-uuid-1',
          status: 'present',
        })
      );
      expect(result).toMatchObject({ employee_id: 'emp-uuid-1', status: 'present' });
    });

    it('throws ConflictError when employee already checked in today', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(mockRecord);

      await expect(service.checkIn('emp-uuid-1')).rejects.toThrow(ConflictError);
    });

    it('throws ValidationError when employee is inactive', async () => {
      mockEmployeeRepo.findById.mockResolvedValue({ ...mockEmployee, status: 'inactive' });

      await expect(service.checkIn('emp-uuid-1')).rejects.toThrow(ValidationError);
    });
  });

  // ─── checkOut ────────────────────────────────────────────────────────────────
  describe('checkOut', () => {
    it('updates the record with check_out time and calculates total_hours', async () => {
      const checkInTime = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(); // 8h ago
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue({
        ...mockRecord,
        check_in: checkInTime,
      });
      mockAttendanceRepo.update.mockResolvedValue({
        ...mockRecord,
        check_in: checkInTime,
        check_out: new Date().toISOString(),
        total_hours: 8.0,
      });

      const result = await service.checkOut('emp-uuid-1');

      expect(mockAttendanceRepo.update).toHaveBeenCalledWith(
        'att-uuid-1',
        expect.objectContaining({ check_out: expect.any(String), total_hours: expect.any(Number) })
      );
      expect(result.total_hours).toBe(8.0);
    });

    it('throws NotFoundError when no check-in exists for today', async () => {
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);

      await expect(service.checkOut('emp-uuid-1')).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when already checked out', async () => {
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue({
        ...mockRecord,
        check_out: new Date().toISOString(),
      });

      await expect(service.checkOut('emp-uuid-1')).rejects.toThrow(ConflictError);
    });
  });

  // ─── getSummary ───────────────────────────────────────────────────────────────
  describe('getSummary', () => {
    it('returns summary enriched with employee details', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee);
      mockAttendanceRepo.getSummary.mockResolvedValue({
        employee_id: 'emp-uuid-1',
        date_from: '2024-02-01',
        date_to: '2024-02-29',
        total_days: 20,
        total_hours: 160,
        by_status: { present: 18, absent: 2 },
      });

      const result = await service.getSummary('emp-uuid-1', '2024-02-01', '2024-02-29');

      expect(result.employee.name).toBe('Jane Doe');
      expect(result.total_days).toBe(20);
      expect(result.by_status.present).toBe(18);
    });
  });
});
