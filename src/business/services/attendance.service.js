'use strict';

const attendanceRepository = require('../../data/repositories/attendance.repository');
const employeeRepository = require('../../data/repositories/employee.repository');
const AppError = require('../../utils/app.error');

// Check-in after this many minutes past midnight is flagged as "late"
const LATE_THRESHOLD_MINUTES = 9 * 60 + 15; // 09:15

/**
 * AttendanceService contains all business logic for attendance tracking.
 */
class AttendanceService {
  /**
   * Retrieve paginated attendance records with optional filters.
   */
  async listAttendance(filters, page, limit) {
    const { count, rows } = await attendanceRepository.findAll(filters, page, limit);
    return { records: rows, total: count };
  }

  /**
   * Get a single attendance record by UUID.
   */
  async getAttendance(id) {
    const record = await attendanceRepository.findById(id);
    if (!record) throw AppError.notFound('Attendance record');
    return record;
  }

  /**
   * Record a check-in for an employee.
   *
   * Business rules:
   *  1. The employee must exist and be active.
   *  2. Only one check-in is allowed per employee per calendar day.
   *  3. Status is determined as "present" or "late" based on check-in time.
   *
   * @param {string} employeeId
   * @param {string} [ip]  - client IP for audit trail
   */
  async checkIn(employeeId, ip = null) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw AppError.notFound('Employee');
    if (!employee.isActive) throw AppError.forbidden('Employee account is inactive');

    const today = new Date().toISOString().split('T')[0];
    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (existing) {
      throw AppError.conflict(`Employee has already checked in today (${today})`);
    }

    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const status = minutesSinceMidnight > LATE_THRESHOLD_MINUTES ? 'late' : 'present';

    return attendanceRepository.create({
      employeeId,
      date: today,
      checkIn: now,
      status,
      checkInIp: ip,
    });
  }

  /**
   * Record a check-out for an employee.
   *
   * Business rules:
   *  1. There must be an existing check-in for today.
   *  2. The employee cannot check out before checking in.
   *  3. Worked hours are computed and persisted.
   *  4. If worked hours are less than half the expected daily hours, status
   *     is downgraded to "half_day".
   *
   * @param {string} employeeId
   * @param {string} [ip]
   */
  async checkOut(employeeId, ip = null) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw AppError.notFound('Employee');

    const today = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

    if (!record) {
      throw AppError.badRequest('No check-in found for today. Please check in first.');
    }
    if (record.checkOut) {
      throw AppError.conflict('Employee has already checked out today.');
    }

    const now = new Date();
    const diffMs = now - new Date(record.checkIn);
    const workedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Downgrade to half_day if worked less than half of expected hours
    let status = record.status; // preserve 'present' or 'late'
    const halfDayThreshold = employee.expectedHoursPerDay / 2;
    if (workedHours < halfDayThreshold) {
      status = 'half_day';
    }

    return attendanceRepository.update(record.id, {
      checkOut: now,
      workedHoursStored: workedHours,
      checkOutIp: ip,
      status,
    });
  }

  /**
   * Manually create or update an attendance record (admin operation).
   */
  async createAttendance(data) {
    const { employeeId, date } = data;

    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw AppError.notFound('Employee');

    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, date);
    if (existing) {
      throw AppError.conflict(
        `An attendance record already exists for employee ${employeeId} on ${date}`
      );
    }

    // Compute worked hours if both timestamps are present
    const payload = { ...data };
    if (data.checkIn && data.checkOut) {
      const diffMs = new Date(data.checkOut) - new Date(data.checkIn);
      payload.workedHoursStored = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    return attendanceRepository.create(payload);
  }

  /**
   * Update an existing attendance record (admin operation).
   */
  async updateAttendance(id, data) {
    await this.getAttendance(id);

    const payload = { ...data };
    if (data.checkIn && data.checkOut) {
      const diffMs = new Date(data.checkOut) - new Date(data.checkIn);
      payload.workedHoursStored = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    return attendanceRepository.update(id, payload);
  }

  /**
   * Delete an attendance record.
   */
  async deleteAttendance(id) {
    await this.getAttendance(id);
    return attendanceRepository.delete(id);
  }

  /**
   * Get an attendance summary (report) for an employee over a date range.
   */
  async getReport(employeeId, startDate, endDate) {
    if (employeeId) {
      const employee = await employeeRepository.findById(employeeId);
      if (!employee) throw AppError.notFound('Employee');
    }

    const summary = await attendanceRepository.getSummary(employeeId, startDate, endDate);
    return { employeeId: employeeId || null, startDate, endDate, summary };
  }
}

module.exports = new AttendanceService();
