'use strict';

const attendanceRepository = require('../repositories/attendanceRepository');
const employeeRepository = require('../repositories/employeeRepository');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Compute the difference in decimal hours between two timestamps.
 */
function calculateWorkHours(checkIn, checkOut) {
  const diffMs = new Date(checkOut) - new Date(checkIn);
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * Determine attendance status based on check-in time and expected start time.
 * Returns 'late' if the employee checked in more than 15 minutes after expected.
 */
function determineStatus(checkInTime, expectedCheckIn) {
  if (!expectedCheckIn) return 'present';

  const [expHour, expMinute] = expectedCheckIn.split(':').map(Number);
  const checkIn = new Date(checkInTime);
  const expected = new Date(checkIn);
  expected.setHours(expHour, expMinute + 15, 0, 0); // 15-minute grace period

  return checkIn > expected ? 'late' : 'present';
}

const attendanceService = {
  async listRecords({ employeeId, status, dateFrom, dateTo, department, page, limit } = {}) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(
      parseInt(limit, 10) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    const { data, total } = await attendanceRepository.findAll({
      employeeId,
      status,
      dateFrom,
      dateTo,
      department,
      page: safePage,
      limit: safeLimit,
    });

    return { data, total, page: safePage, limit: safeLimit };
  },

  async getRecordById(id) {
    const record = await attendanceRepository.findById(id);
    if (!record) throw new NotFoundError('Attendance record', id);
    return record;
  },

  /**
   * Record a check-in event for an employee.
   *
   * Business rules:
   * - Employee must be active
   * - Only one check-in per employee per calendar day
   * - Status is automatically derived from expected start time
   */
  async checkIn({ employeeId, notes, location }) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee', employeeId);
    if (employee.status !== 'active') {
      throw new BadRequestError(`Employee '${employee.employee_code}' is not active`);
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (existing) {
      throw new ConflictError(
        `Employee '${employee.employee_code}' already has an attendance record for ${today}`
      );
    }

    const checkInTime = new Date();
    const status = determineStatus(checkInTime, employee.expected_check_in);

    const record = await attendanceRepository.create({
      employee_id: employeeId,
      date: today,
      check_in: checkInTime,
      status,
      notes: notes || null,
      check_in_location: location || null,
    });

    logger.info('Check-in recorded', {
      employeeId,
      employeeCode: employee.employee_code,
      date: today,
      status,
    });

    return record;
  },

  /**
   * Record a check-out event for an employee.
   *
   * Business rules:
   * - A check-in must exist for today without a check-out
   * - Work hours are computed and stored on check-out
   * - Records with less than 4 hours are marked as half_day
   */
  async checkOut({ employeeId, notes, location }) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee', employeeId);

    const openRecord = await attendanceRepository.findOpenRecord(employeeId);
    if (!openRecord) {
      throw new BadRequestError(
        `No active check-in found for employee '${employee.employee_code}'. Please check in first.`
      );
    }

    const checkOutTime = new Date();

    if (checkOutTime <= new Date(openRecord.check_in)) {
      throw new BadRequestError('Check-out time must be after check-in time');
    }

    const workHours = calculateWorkHours(openRecord.check_in, checkOutTime);
    const STANDARD_HOURS = 8;
    const OVERTIME_THRESHOLD = STANDARD_HOURS + 1;

    // Refine status: short shifts become half_day
    let status = openRecord.status;
    if (workHours < 4) status = 'half_day';

    const record = await attendanceRepository.update(openRecord.id, {
      check_out: checkOutTime,
      work_hours: workHours,
      is_overtime: workHours > OVERTIME_THRESHOLD,
      status,
      notes: notes || openRecord.notes,
      check_out_location: location || null,
    });

    logger.info('Check-out recorded', {
      employeeId,
      employeeCode: employee.employee_code,
      workHours,
      isOvertime: record.is_overtime,
    });

    return record;
  },

  async updateRecord(id, updateData) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) throw new NotFoundError('Attendance record', id);

    // Recompute work_hours if both timestamps are present after update
    const checkIn = updateData.check_in || existing.check_in;
    const checkOut = updateData.check_out || existing.check_out;
    if (checkIn && checkOut) {
      updateData.work_hours = calculateWorkHours(checkIn, checkOut);
    }

    const record = await attendanceRepository.update(id, updateData);
    logger.info('Attendance record updated', { recordId: id });
    return record;
  },

  async deleteRecord(id) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) throw new NotFoundError('Attendance record', id);
    await attendanceRepository.delete(id);
    logger.info('Attendance record deleted', { recordId: id });
  },

  async getSummaryReport({ employeeId, dateFrom, dateTo, department } = {}) {
    const data = await attendanceRepository.getSummaryReport({
      employeeId,
      dateFrom,
      dateTo,
      department,
    });

    // Normalize numeric fields returned as strings by some drivers
    return data.map((row) => ({
      ...row,
      total_records: parseInt(row.total_records, 10) || 0,
      total_hours: parseFloat(row.total_hours) || 0,
      avg_hours: parseFloat(row.avg_hours) || 0,
      present_count: parseInt(row.present_count, 10) || 0,
      absent_count: parseInt(row.absent_count, 10) || 0,
      late_count: parseInt(row.late_count, 10) || 0,
    }));
  },
};

module.exports = attendanceService;
