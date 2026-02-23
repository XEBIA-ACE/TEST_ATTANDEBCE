'use strict';

const AttendanceRepository = require('../../infrastructure/repositories/attendanceRepository');
const EmployeeRepository = require('../../infrastructure/repositories/employeeRepository');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const metrics = require('../../utils/metrics');

/**
 * Business logic layer for Attendance operations.
 */
class AttendanceService {
  constructor(attendanceRepository = null, employeeRepository = null) {
    this.attendanceRepo = attendanceRepository || new AttendanceRepository();
    this.employeeRepo = employeeRepository || new EmployeeRepository();
  }

  /**
   * Lists attendance records with pagination and filtering.
   */
  async listAttendance(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.attendanceRepo.findAll({ ...filters, page: safePage, limit: safeLimit });
  }

  /**
   * Retrieves a single attendance record.
   */
  async getAttendanceRecord(id) {
    return this.attendanceRepo.findById(id);
  }

  /**
   * Records employee check-in.
   * Enforces one check-in per day per employee.
   */
  async checkIn(employeeId, data = {}) {
    // Validate employee exists and is active
    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee.isActive()) {
      throw AppError.badRequest(
        `Employee '${employee.fullName}' is not active and cannot check in`
      );
    }

    // Prevent duplicate check-in on the same day
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.attendanceRepo.findByEmployeeAndDate(employeeId, today);
    if (existing) {
      throw AppError.conflict(
        `Employee '${employee.fullName}' has already checked in today`
      );
    }

    const checkInTime = data.check_in ? new Date(data.check_in) : new Date();

    const record = await this.attendanceRepo.create({
      employee_id: employeeId,
      date: today,
      check_in: checkInTime,
      status: Attendance.STATUS.PRESENT,
      notes: data.notes || null,
    });

    metrics.checkInsTotal.inc();
    logger.info('Employee checked in', {
      employee_id: employeeId,
      record_id: record.id,
      check_in: checkInTime,
    });

    return record;
  }

  /**
   * Records employee check-out and calculates total hours.
   */
  async checkOut(employeeId, data = {}) {
    // Validate employee exists
    const employee = await this.employeeRepo.findById(employeeId);

    // Find today's check-in record
    const today = new Date().toISOString().split('T')[0];
    const record = await this.attendanceRepo.findByEmployeeAndDate(employeeId, today);

    if (!record) {
      throw AppError.badRequest(
        `No check-in record found for employee '${employee.fullName}' today`
      );
    }

    if (record.hasCheckedOut()) {
      throw AppError.conflict(
        `Employee '${employee.fullName}' has already checked out today`
      );
    }

    const checkOutTime = data.check_out ? new Date(data.check_out) : new Date();

    // Ensure check-out is after check-in
    if (checkOutTime <= record.check_in) {
      throw AppError.badRequest('Check-out time must be after check-in time');
    }

    // Calculate hours worked
    record.check_out = checkOutTime;
    const totalHours = record.calculateTotalHours();

    const updated = await this.attendanceRepo.update(record.id, {
      check_out: checkOutTime,
      total_hours: totalHours,
      notes: data.notes || record.notes,
    });

    metrics.checkOutsTotal.inc();
    logger.info('Employee checked out', {
      employee_id: employeeId,
      record_id: updated.id,
      check_out: checkOutTime,
      total_hours: totalHours,
    });

    return updated;
  }

  /**
   * Creates or updates an attendance record manually (admin use).
   */
  async upsertAttendance(employeeId, date, data) {
    await this.employeeRepo.findById(employeeId); // Validate employee

    const existing = await this.attendanceRepo.findByEmployeeAndDate(employeeId, date);

    if (existing) {
      // Update existing record
      const updatePayload = { ...data };
      if (updatePayload.check_in && updatePayload.check_out) {
        const temp = new Attendance({ ...existing.toJSON(), ...updatePayload });
        updatePayload.total_hours = temp.calculateTotalHours();
      }
      const updated = await this.attendanceRepo.update(existing.id, updatePayload);
      logger.info('Attendance record updated', { record_id: updated.id, employee_id: employeeId });
      return updated;
    }

    // Create new record
    const created = await this.attendanceRepo.create({ employee_id: employeeId, date, ...data });
    logger.info('Attendance record created', { record_id: created.id, employee_id: employeeId });
    return created;
  }

  /**
   * Deletes an attendance record.
   */
  async deleteAttendanceRecord(id) {
    await this.attendanceRepo.delete(id);
    logger.info('Attendance record deleted', { record_id: id });
    return { message: 'Attendance record deleted successfully' };
  }

  /**
   * Generates an attendance summary report for a specific employee.
   */
  async getEmployeeSummary(employeeId, dateFrom, dateTo) {
    await this.employeeRepo.findById(employeeId); // Validate employee

    const summary = await this.attendanceRepo.getSummaryByEmployee(employeeId, dateFrom, dateTo);

    const totalDays = Object.values(summary).reduce((acc, s) => acc + s.count, 0);
    const totalHours = Object.values(summary).reduce((acc, s) => acc + s.total_hours, 0);

    return {
      employee_id: employeeId,
      date_from: dateFrom,
      date_to: dateTo,
      total_days: totalDays,
      total_hours: Math.round(totalHours * 100) / 100,
      breakdown: summary,
    };
  }

  /**
   * Returns department-level attendance statistics for a given date.
   */
  async getDepartmentReport(date) {
    const rows = await this.attendanceRepo.getDepartmentStats(date);

    // Transform flat rows into a nested department -> status structure
    const report = {};
    for (const row of rows) {
      if (!report[row.department]) {
        report[row.department] = { total: 0, statuses: {} };
      }
      const count = parseInt(row.count, 10);
      report[row.department].statuses[row.status] = count;
      report[row.department].total += count;
    }

    return { date, departments: report };
  }
}

module.exports = AttendanceService;
