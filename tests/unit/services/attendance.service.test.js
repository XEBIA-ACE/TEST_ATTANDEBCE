'use strict';

require('../../setup');

const attendanceService = require('../../../src/business/services/attendance.service');
const attendanceRepository = require('../../../src/data/repositories/attendance.repository');
const employeeRepository = require('../../../src/data/repositories/employee.repository');

jest.mock('../../../src/data/repositories/attendance.repository');
jest.mock('../../../src/data/repositories/employee.repository');

const EMPLOYEE_ID = 'employee-uuid-001';
const TODAY = new Date().toISOString().split('T')[0];

const mockEmployee = {
  id: EMPLOYEE_ID,
  isActive: true,
  expectedHoursPerDay: 8,
};

describe('AttendanceService', () => {
  afterEach(() => jest.clearAllMocks());

  // ── checkIn ──────────────────────────────────────────────────────────────────
  describe('checkIn()', () => {
    it('creates a check-in record for an active employee', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);

      const mockRecord = { id: 'att-1', employeeId: EMPLOYEE_ID, date: TODAY };
      attendanceRepository.create.mockResolvedValue(mockRecord);

      const result = await attendanceService.checkIn(EMPLOYEE_ID, '127.0.0.1');
      expect(result).toBe(mockRecord);
      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: EMPLOYEE_ID, date: TODAY })
      );
    });

    it('throws 404 when employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(attendanceService.checkIn(EMPLOYEE_ID)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when employee is inactive', async () => {
      employeeRepository.findById.mockResolvedValue({ ...mockEmployee, isActive: false });

      await expect(attendanceService.checkIn(EMPLOYEE_ID)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('throws 409 when already checked in today', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue({ id: 'existing' });

      await expect(attendanceService.checkIn(EMPLOYEE_ID)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  // ── checkOut ─────────────────────────────────────────────────────────────────
  describe('checkOut()', () => {
    it('records check-out and computes worked hours', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);

      const checkInTime = new Date();
      checkInTime.setHours(checkInTime.getHours() - 8);

      const existingRecord = { id: 'att-1', checkIn: checkInTime, checkOut: null };
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(existingRecord);
      attendanceRepository.update.mockResolvedValue({ ...existingRecord, checkOut: new Date() });

      const result = await attendanceService.checkOut(EMPLOYEE_ID, '127.0.0.1');
      expect(result).toBeDefined();
      expect(attendanceRepository.update).toHaveBeenCalledWith(
        'att-1',
        expect.objectContaining({ workedHoursStored: expect.any(Number) })
      );
    });

    it('throws 400 when no check-in exists for today', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);

      await expect(attendanceService.checkOut(EMPLOYEE_ID)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('throws 409 when already checked out', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue({
        id: 'att-1',
        checkIn: new Date(),
        checkOut: new Date(), // already checked out
      });

      await expect(attendanceService.checkOut(EMPLOYEE_ID)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });
});
