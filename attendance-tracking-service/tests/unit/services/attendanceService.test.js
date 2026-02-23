'use strict';

const AttendanceService = require('../../../src/domain/services/attendanceService');
const Attendance = require('../../../src/domain/models/Attendance');
const Employee = require('../../../src/domain/models/Employee');
const AppError = require('../../../src/utils/AppError');

const mockAttendanceRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmployeeAndDate: jest.fn(),
  findTodayByEmployeeId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getSummaryByEmployee: jest.fn(),
  getDepartmentStats: jest.fn(),
};

const mockEmployeeRepo = {
  findById: jest.fn(),
};

const activeEmployee = new Employee({
  id: 'emp-001',
  employee_number: 'EMP001',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  department: 'Engineering',
  position: 'Developer',
  status: 'active',
  hire_date: '2023-01-01',
  created_at: new Date(),
  updated_at: new Date(),
});

const inactiveEmployee = new Employee({ ...activeEmployee, status: 'inactive' });

const today = new Date().toISOString().split('T')[0];

const sampleAttendance = new Attendance({
  id: 'att-001',
  employee_id: 'emp-001',
  date: today,
  check_in: new Date(),
  check_out: null,
  status: 'present',
  total_hours: null,
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
});

describe('AttendanceService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttendanceService(mockAttendanceRepo, mockEmployeeRepo);
  });

  // ── checkIn ──────────────────────────────────────────────────────────────────

  describe('checkIn', () => {
    it('should record check-in for active employee', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(activeEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(null); // No existing record
      mockAttendanceRepo.create.mockResolvedValue(sampleAttendance);

      const result = await service.checkIn('emp-001', {});

      expect(mockAttendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: 'emp-001', date: today })
      );
      expect(result).toBe(sampleAttendance);
    });

    it('should reject check-in for inactive employee', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(inactiveEmployee);

      await expect(service.checkIn('emp-001', {})).rejects.toMatchObject({ statusCode: 400 });
      expect(mockAttendanceRepo.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate check-in on same day', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(activeEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(sampleAttendance); // Already checked in

      await expect(service.checkIn('emp-001', {})).rejects.toMatchObject({ statusCode: 409 });
      expect(mockAttendanceRepo.create).not.toHaveBeenCalled();
    });
  });

  // ── checkOut ─────────────────────────────────────────────────────────────────

  describe('checkOut', () => {
    it('should record check-out and calculate hours', async () => {
      const checkInTime = new Date();
      checkInTime.setHours(checkInTime.getHours() - 8); // 8 hours ago

      const recordWithCheckIn = new Attendance({
        ...sampleAttendance,
        check_in: checkInTime,
        check_out: null,
      });

      mockEmployeeRepo.findById.mockResolvedValue(activeEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(recordWithCheckIn);
      mockAttendanceRepo.update.mockResolvedValue({
        ...recordWithCheckIn,
        check_out: new Date(),
        total_hours: 8,
      });

      const result = await service.checkOut('emp-001', {});

      expect(mockAttendanceRepo.update).toHaveBeenCalledWith(
        recordWithCheckIn.id,
        expect.objectContaining({ total_hours: expect.any(Number) })
      );
    });

    it('should reject check-out if no check-in found', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(activeEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);

      await expect(service.checkOut('emp-001', {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should reject duplicate check-out', async () => {
      const checkedOutRecord = new Attendance({
        ...sampleAttendance,
        check_out: new Date(), // Already has check-out
      });

      mockEmployeeRepo.findById.mockResolvedValue(activeEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(checkedOutRecord);

      await expect(service.checkOut('emp-001', {})).rejects.toMatchObject({ statusCode: 409 });
    });

    it('should reject check-out time before check-in', async () => {
      const recordWithCheckIn = new Attendance({
        ...sampleAttendance,
        check_in: new Date(), // Just now
        check_out: null,
      });

      mockEmployeeRepo.findById.mockResolvedValue(activeEmployee);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(recordWithCheckIn);

      // Pass check-out time 1 hour in the past (before check-in)
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);

      await expect(
        service.checkOut('emp-001', { check_out: pastTime.toISOString() })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── getEmployeeSummary ───────────────────────────────────────────────────────

  describe('getEmployeeSummary', () => {
    it('should return summary with correct totals', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(activeEmployee);
      mockAttendanceRepo.getSummaryByEmployee.mockResolvedValue({
        present: { count: 18, total_hours: 144 },
        late: { count: 2, total_hours: 14 },
      });

      const result = await service.getEmployeeSummary(
        'emp-001',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result.total_days).toBe(20);
      expect(result.total_hours).toBe(158);
      expect(result.breakdown).toHaveProperty('present');
    });
  });
});
