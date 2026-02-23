'use strict';

const attendanceRepository = require('../repositories/attendanceRepository');
const employeeRepository = require('../repositories/employeeRepository');
const {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ValidationError,
} = require('../utils/errors');
const logger = require('../utils/logger');

// Default work hours threshold (minutes) to flag a check-in as "late"
const LATE_THRESHOLD_HOUR = 9; // 09:00 local time
const LATE_THRESHOLD_MINUTE = 15; // grace period of 15 minutes

/**
 * Calculates work hours between two Date objects.
 * Returns null when either timestamp is missing.
 */
function computeWorkHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const diffMs = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, parseFloat((diffMs / 3_600_000).toFixed(2)));
}

/**
 * Derives an attendance status from check-in time and work hours.
 * Rules:
 *  - No check-in  → absent
 *  - Work hours < 4 → half_day
 *  - Check-in after 09:15 → late
 *  - Otherwise → present
 */
function deriveStatus(checkInTime, workHours) {
  if (!checkInTime) return 'absent';
  const hour = new Date(checkInTime).getUTCHours();
  const minute = new Date(checkInTime).getUTCMinutes();
  if (workHours !== null && workHours < 4) return 'half_day';
  if (hour > LATE_THRESHOLD_HOUR || (hour === LATE_THRESHOLD_HOUR && minute > LATE_THRESHOLD_MINUTE)) {
    return 'late';
  }
  return 'present';
}

/**
 * Business logic for attendance tracking.
 */
class AttendanceService {
  async listRecords(filters = {}) {
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));

    const { rows, total } = await attendanceRepository.findAll({ ...filters, page, limit });
    return { records: rows, total, page, limit };
  }

  async getRecord(id) {
    const record = await attendanceRepository.findById(id);
    if (!record) throw new NotFoundError('Attendance record');
    return record;
  }

  /**
   * Records a check-in for an employee.
   * Creates a new attendance record for today if one doesn't exist yet.
   * Prevents duplicate check-ins on the same calendar day.
   */
  async checkIn(employeeId, { notes, checkInTime } = {}) {
    // Verify the employee exists and is active
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee');
    if (employee.status !== 'active') {
      throw new BadRequestError(`Cannot record attendance for an employee with status '${employee.status}'`);
    }

    const checkInTs = checkInTime ? new Date(checkInTime) : new Date();
    const dateStr = checkInTs.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Prevent duplicate check-ins on the same day
    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, dateStr);
    if (existing) {
      if (existing.check_in_time) {
        throw new ConflictError(
          `Employee ${employeeId} has already checked in on ${dateStr}. Use the check-out endpoint instead.`
        );
      }
    }

    const status = deriveStatus(checkInTs, null);

    let record;
    if (existing) {
      // Record exists (created via admin / manual entry) — update with check-in time
      record = await attendanceRepository.update(existing.id, {
        check_in_time: checkInTs,
        status,
        notes,
      });
    } else {
      record = await attendanceRepository.create({
        employee_id: employeeId,
        date: dateStr,
        check_in_time: checkInTs,
        status,
        notes,
      });
    }

    logger.info('Check-in recorded', { employeeId, date: dateStr, checkInTime: checkInTs });
    return record;
  }

  /**
   * Records a check-out for an employee.
   * Requires an existing check-in record for today.
   * Calculates and persists work hours automatically.
   */
  async checkOut(employeeId, { notes, checkOutTime } = {}) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee');

    const checkOutTs = checkOutTime ? new Date(checkOutTime) : new Date();
    const dateStr = checkOutTs.toISOString().slice(0, 10);

    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, dateStr);
    if (!existing) {
      throw new BadRequestError(`No check-in record found for employee ${employeeId} on ${dateStr}`);
    }
    if (!existing.check_in_time) {
      throw new BadRequestError(`Employee ${employeeId} has not checked in yet on ${dateStr}`);
    }
    if (existing.check_out_time) {
      throw new ConflictError(`Employee ${employeeId} has already checked out on ${dateStr}`);
    }

    if (new Date(checkOutTs) <= new Date(existing.check_in_time)) {
      throw new ValidationError('Check-out time must be after check-in time');
    }

    const workHours = computeWorkHours(existing.check_in_time, checkOutTs);
    const status = deriveStatus(existing.check_in_time, workHours);

    const record = await attendanceRepository.update(existing.id, {
      check_out_time: checkOutTs,
      work_hours: workHours,
      status,
      ...(notes !== undefined && { notes }),
    });

    logger.info('Check-out recorded', { employeeId, date: dateStr, workHours });
    return record;
  }

  /**
   * Creates or updates an attendance record manually (admin use).
   */
  async upsertRecord(employeeId, date, data) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee');

    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, date);

    const payload = { ...data };

    // Recalculate work_hours if both timestamps are present
    const checkIn = payload.check_in_time || (existing && existing.check_in_time);
    const checkOut = payload.check_out_time || (existing && existing.check_out_time);
    payload.work_hours = computeWorkHours(checkIn, checkOut);

    if (!payload.status) {
      payload.status = deriveStatus(checkIn, payload.work_hours);
    }

    let record;
    if (existing) {
      record = await attendanceRepository.update(existing.id, payload);
    } else {
      record = await attendanceRepository.create({
        employee_id: employeeId,
        date,
        ...payload,
      });
    }

    logger.info('Attendance record upserted', { employeeId, date });
    return record;
  }

  async deleteRecord(id) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) throw new NotFoundError('Attendance record');
    await attendanceRepository.delete(id);
    logger.info('Attendance record deleted', { recordId: id });
  }

  /** Returns aggregated attendance statistics for reporting. */
  async getReport(filters = {}) {
    return attendanceRepository.getReport(filters);
  }
}

module.exports = new AttendanceService();
