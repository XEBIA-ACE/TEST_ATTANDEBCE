'use strict';

const attendanceRepository = require('../repositories/attendance.repository');
const employeeRepository = require('../repositories/employee.repository');
const { ATTENDANCE_STATUS } = require('../models/attendance.model');
const logger = require('../config/logger');

/**
 * Business-logic layer for attendance records.
 */
class AttendanceService {
  /**
   * List attendance records with pagination and filters.
   */
  async list(options) {
    const { records, total } = await attendanceRepository.findAll({
      page: options.page,
      limit: options.limit,
      employeeId: options.employee_id,
      startDate: options.start_date,
      endDate: options.end_date,
      status: options.status,
      department: options.department,
    });

    const { page = 1, limit = 20 } = options;
    return {
      records: records.map((r) => r.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single record by ID.
   */
  async getById(id) {
    const record = await attendanceRepository.findById(id);
    if (!record) {
      const err = new Error(`Attendance record '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }
    return record.toJSON();
  }

  /**
   * Record an employee's check-in for today (or a specified date/time).
   * Prevents duplicate check-ins on the same day.
   */
  async checkIn({ employee_id, check_in_time, notes }) {
    // Verify employee exists and is active
    const employee = await employeeRepository.findById(employee_id);
    if (!employee) {
      const err = new Error(`Employee '${employee_id}' not found`);
      err.statusCode = 404;
      throw err;
    }
    if (!employee.isActive) {
      const err = new Error('Cannot record attendance for an inactive employee');
      err.statusCode = 400;
      throw err;
    }

    const checkInAt = check_in_time ? new Date(check_in_time) : new Date();
    const dateStr = checkInAt.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check for an existing record on this date
    const existing = await attendanceRepository.findByEmployeeAndDate(employee_id, dateStr);
    if (existing) {
      const err = new Error(
        `Employee already has an attendance record for ${dateStr}. Use check-out or update instead.`
      );
      err.statusCode = 409;
      throw err;
    }

    // Determine status: if check-in is after 09:30, mark as late
    const LATE_THRESHOLD_HOUR = 9;
    const LATE_THRESHOLD_MINUTE = 30;
    const isLate =
      checkInAt.getHours() > LATE_THRESHOLD_HOUR ||
      (checkInAt.getHours() === LATE_THRESHOLD_HOUR &&
        checkInAt.getMinutes() > LATE_THRESHOLD_MINUTE);

    const status = isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;

    const record = await attendanceRepository.create({
      employee_id,
      date: dateStr,
      check_in_time: checkInAt.toISOString(),
      status,
      notes: notes || null,
    });

    logger.info('Employee checked in', {
      employeeId: employee_id,
      date: dateStr,
      checkInTime: checkInAt.toISOString(),
      status,
    });

    return record.toJSON();
  }

  /**
   * Record an employee's check-out for today's existing record.
   */
  async checkOut(recordId, { check_out_time, notes }) {
    const existing = await attendanceRepository.findById(recordId);
    if (!existing) {
      const err = new Error(`Attendance record '${recordId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    if (existing.checkOutTime) {
      const err = new Error('Employee has already checked out for this record');
      err.statusCode = 400;
      throw err;
    }

    const checkOutAt = check_out_time ? new Date(check_out_time) : new Date();

    if (existing.checkInTime && checkOutAt <= new Date(existing.checkInTime)) {
      const err = new Error('Check-out time must be after check-in time');
      err.statusCode = 400;
      throw err;
    }

    const updates = { check_out_time: checkOutAt.toISOString() };
    if (notes !== undefined) {
      updates.notes = notes;
    }

    const updated = await attendanceRepository.update(recordId, updates);

    logger.info('Employee checked out', {
      recordId,
      checkOutTime: checkOutAt.toISOString(),
    });

    return updated.toJSON();
  }

  /**
   * Manually create or edit an attendance record (admin use).
   */
  async create(data) {
    // Verify employee exists
    const employee = await employeeRepository.findById(data.employee_id);
    if (!employee) {
      const err = new Error(`Employee '${data.employee_id}' not found`);
      err.statusCode = 404;
      throw err;
    }

    // Check for duplicates
    const dateStr = new Date(data.date).toISOString().split('T')[0];
    const existing = await attendanceRepository.findByEmployeeAndDate(data.employee_id, dateStr);
    if (existing) {
      const err = new Error(`Attendance record already exists for this employee on ${dateStr}`);
      err.statusCode = 409;
      throw err;
    }

    const record = await attendanceRepository.create({ ...data, date: dateStr });
    logger.info('Attendance record created manually', { recordId: record.id });
    return record.toJSON();
  }

  /**
   * Update an attendance record (admin use).
   */
  async update(id, updates) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) {
      const err = new Error(`Attendance record '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }

    const record = await attendanceRepository.update(id, updates);
    logger.info('Attendance record updated', { recordId: id });
    return record.toJSON();
  }

  /**
   * Delete an attendance record.
   */
  async delete(id) {
    const deleted = await attendanceRepository.delete(id);
    if (!deleted) {
      const err = new Error(`Attendance record '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }
    logger.info('Attendance record deleted', { recordId: id });
    return { message: 'Attendance record deleted successfully' };
  }

  /**
   * Generate a summary report for a date range.
   */
  async getSummaryReport(options) {
    const rows = await attendanceRepository.getSummaryReport({
      startDate: options.start_date,
      endDate: options.end_date,
      employeeId: options.employee_id,
      department: options.department,
    });

    return {
      period: { start_date: options.start_date, end_date: options.end_date },
      results: rows,
    };
  }
}

module.exports = new AttendanceService();
