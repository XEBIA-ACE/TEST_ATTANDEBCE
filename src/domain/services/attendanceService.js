const { v4: uuidv4 } = require('uuid');
const attendanceRepository = require('../../infrastructure/repositories/attendanceRepository');
const employeeRepository = require('../../infrastructure/repositories/employeeRepository');
const logger = require('../../config/logger');

/**
 * Business logic layer for Attendance management.
 * Enforces check-in/check-out rules, status derivation, and daily uniqueness.
 */
class AttendanceService {
  // Expected start of workday (24-hour format, local time)
  static WORK_START_HOUR = 9;
  static WORK_START_MINUTE = 0;
  static LATE_GRACE_MINUTES = 15;

  async getAllRecords(filters) {
    return attendanceRepository.findAll(filters);
  }

  async getRecordById(id) {
    const record = await attendanceRepository.findById(id);
    if (!record) {
      const err = new Error('Attendance record not found');
      err.statusCode = 404;
      throw err;
    }
    return record;
  }

  /**
   * Records an employee check-in.
   * Enforces: employee must be active, no duplicate check-in on the same day.
   */
  async checkIn(employeeId, { notes } = {}) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }
    if (!employee.isActive) {
      const err = new Error('Only active employees can check in');
      err.statusCode = 422;
      throw err;
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (existing) {
      const err = new Error('Employee has already checked in today');
      err.statusCode = 409;
      throw err;
    }

    const checkInTime = new Date();
    const status = this._deriveStatus(checkInTime);

    const record = await attendanceRepository.create({
      id: uuidv4(),
      employee_id: employeeId,
      date: today,
      check_in: checkInTime,
      status,
      notes: notes || null,
    });

    logger.info('Employee checked in', { employeeId, date: today, status });
    return record;
  }

  /**
   * Records an employee check-out.
   * Requires an open check-in session for today.
   */
  async checkOut(employeeId, { notes } = {}) {
    const today = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findActiveCheckIn(employeeId, today);

    if (!record) {
      const err = new Error('No active check-in found for today');
      err.statusCode = 422;
      throw err;
    }

    const checkOutTime = new Date();
    const updated = await attendanceRepository.update(record.id, {
      check_out: checkOutTime,
      notes: notes || record.notes,
    });

    logger.info('Employee checked out', {
      employeeId,
      date: today,
      totalHours: updated.totalHours,
    });
    return updated;
  }

  async createRecord(data) {
    const employee = await employeeRepository.findById(data.employee_id);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    const existing = await attendanceRepository.findByEmployeeAndDate(
      data.employee_id,
      data.date
    );
    if (existing) {
      const err = new Error('Attendance record already exists for this employee on this date');
      err.statusCode = 409;
      throw err;
    }

    const record = await attendanceRepository.create({ id: uuidv4(), ...data });
    return record;
  }

  async updateRecord(id, data) {
    const record = await attendanceRepository.update(id, data);
    if (!record) {
      const err = new Error('Attendance record not found');
      err.statusCode = 404;
      throw err;
    }
    return record;
  }

  async deleteRecord(id) {
    const deleted = await attendanceRepository.delete(id);
    if (!deleted) {
      const err = new Error('Attendance record not found');
      err.statusCode = 404;
      throw err;
    }
  }

  /**
   * Derives attendance status from check-in time relative to shift start.
   * Late arrivals (> LATE_GRACE_MINUTES past shift start) are marked 'late'.
   */
  _deriveStatus(checkInTime) {
    const shiftStart = new Date(checkInTime);
    shiftStart.setHours(
      AttendanceService.WORK_START_HOUR,
      AttendanceService.WORK_START_MINUTE,
      0,
      0
    );

    const lateThreshold = new Date(
      shiftStart.getTime() + AttendanceService.LATE_GRACE_MINUTES * 60 * 1000
    );

    return checkInTime > lateThreshold ? 'late' : 'present';
  }
}

module.exports = new AttendanceService();
