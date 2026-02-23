'use strict';

const attendanceService = require('../../../src/services/attendance.service');
const attendanceRepository = require('../../../src/repositories/attendance.repository');
const employeeRepository = require('../../../src/repositories/employee.repository');

jest.mock('../../../src/repositories/attendance.repository');
jest.mock('../../../src/repositories/employee.repository');
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const TODAY = new Date().toISOString().split('T')[0];

const makeEmployee = (overrides = {}) => ({
  id: 'emp-uuid-1',
  employeeCode: 'EMP-001',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  isActive: true,
  toJSON() { return this; },
  ...overrides,
});

const makeRecord = (overrides = {}) => ({
  id: 'att-uuid-1',
  employeeId: 'emp-uuid-1',
  date: TODAY,
  checkInTime: new Date().toISOString(),
  checkOutTime: null,
  status: 'present',
  notes: null,
  totalHours: null,
  isCheckedOut: false,
  toJSON() { return this; },
  ...overrides,
});

describe('AttendanceService', () => {
  afterEach(() => jest.clearAllMocks());

  // ── checkIn ───────────────────────────────────────────────────────────────
  describe('checkIn()', () => {
    it('creates a check-in record for an active employee', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
      attendanceRepository.create.mockResolvedValue(makeRecord());

      const result = await attendanceService.checkIn({
        employee_id: 'emp-uuid-1',
      });

      expect(result.employeeId).toBe('emp-uuid-1');
      expect(attendanceRepository.create).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(
        attendanceService.checkIn({ employee_id: 'nonexistent' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when employee is inactive', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee({ isActive: false }));

      await expect(
        attendanceService.checkIn({ employee_id: 'emp-uuid-1' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 409 when employee already checked in today', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(makeRecord());

      await expect(
        attendanceService.checkIn({ employee_id: 'emp-uuid-1' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('marks status as "late" when check-in is after 09:30', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
      attendanceRepository.create.mockImplementation((data) =>
        Promise.resolve(makeRecord({ status: data.status }))
      );

      // 10:00 check-in
      const lateTime = new Date();
      lateTime.setHours(10, 0, 0, 0);

      const result = await attendanceService.checkIn({
        employee_id: 'emp-uuid-1',
        check_in_time: lateTime.toISOString(),
      });

      expect(result.status).toBe('late');
    });
  });

  // ── checkOut ──────────────────────────────────────────────────────────────
  describe('checkOut()', () => {
    it('records check-out successfully', async () => {
      const checkOutTime = new Date().toISOString();
      attendanceRepository.findById.mockResolvedValue(makeRecord());
      attendanceRepository.update.mockResolvedValue(
        makeRecord({ checkOutTime, isCheckedOut: true })
      );

      const result = await attendanceService.checkOut('att-uuid-1', {});
      expect(result.isCheckedOut).toBe(true);
    });

    it('throws 404 when record does not exist', async () => {
      attendanceRepository.findById.mockResolvedValue(null);

      await expect(
        attendanceService.checkOut('nonexistent', {})
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when already checked out', async () => {
      attendanceRepository.findById.mockResolvedValue(
        makeRecord({ checkOutTime: new Date().toISOString(), isCheckedOut: true })
      );

      await expect(
        attendanceService.checkOut('att-uuid-1', {})
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('deletes a record successfully', async () => {
      attendanceRepository.delete.mockResolvedValue(true);

      const result = await attendanceService.delete('att-uuid-1');
      expect(result.message).toMatch(/deleted/i);
    });

    it('throws 404 when record not found', async () => {
      attendanceRepository.delete.mockResolvedValue(false);

      await expect(attendanceService.delete('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
