const AttendanceRepository = require('../repositories/attendance.repository');
const EmployeeRepository = require('../repositories/employee.repository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { ATTENDANCE_STATUS, calculateHoursWorked } = require('../models/attendance.model');
const { ValidationError, ConflictError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Business Logic Layer for Attendance operations.
 * Enforces check-in/check-out flow, calculates hours, and computes summaries.
 */
class AttendanceService {
  constructor() {
    this.repository = new AttendanceRepository();
    this.employeeRepository = new EmployeeRepository();
  }

  /**
   * List attendance records with filters and pagination.
   */
  async listRecords(query) {
    const { page, limit, offset } = parsePagination(query);
    const { employee_id, date_from, date_to, status } = query;

    const { rows, total } = await this.repository.findAll({
      page, limit, offset, employee_id, date_from, date_to, status,
    });

    return {
      data: rows,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Get a single attendance record by ID.
   */
  async getRecord(id) {
    return this.repository.findById(id);
  }

  /**
   * Record an employee checking in.
   * Prevents duplicate check-ins on the same day.
   */
  async checkIn(employee_id, { notes, location } = {}) {
    // Verify employee exists and is active
    const employee = await this.employeeRepository.findById(employee_id);
    if (employee.status !== 'active') {
      throw new ValidationError('Only active employees can check in');
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await this.repository.findByEmployeeAndDate(employee_id, today);

    if (existing) {
      if (existing.check_in) {
        throw new ConflictError('Employee has already checked in today');
      }
      // Update existing absent record with a check-in
      return this.repository.update(existing.id, {
        check_in: new Date().toISOString(),
        status: ATTENDANCE_STATUS.PRESENT,
        notes,
      });
    }

    const record = await this.repository.create({
      employee_id,
      date: today,
      check_in: new Date().toISOString(),
      status: ATTENDANCE_STATUS.PRESENT,
      notes: notes || null,
      location: location || null,
      total_hours: null,
    });

    logger.info('Employee checked in', { employee_id, date: today, record_id: record.id });
    return record;
  }

  /**
   * Record an employee checking out.
   * Calculates total hours worked.
   */
  async checkOut(employee_id, { notes, location } = {}) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.repository.findByEmployeeAndDate(employee_id, today);

    if (!existing) {
      throw new NotFoundError('No check-in record found for today');
    }
    if (!existing.check_in) {
      throw new ValidationError('Employee has not checked in today');
    }
    if (existing.check_out) {
      throw new ConflictError('Employee has already checked out today');
    }

    const checkOutTime = new Date().toISOString();
    const totalHours = calculateHoursWorked(existing.check_in, checkOutTime);

    const updated = await this.repository.update(existing.id, {
      check_out: checkOutTime,
      total_hours: totalHours,
      notes: notes || existing.notes,
      location: location || existing.location,
    });

    logger.info('Employee checked out', {
      employee_id,
      date: today,
      total_hours: totalHours,
    });

    return updated;
  }

  /**
   * Manually create an attendance record (admin use).
   */
  async createRecord(data) {
    // Validate employee exists
    await this.employeeRepository.findById(data.employee_id);

    const totalHours =
      data.check_in && data.check_out
        ? calculateHoursWorked(data.check_in, data.check_out)
        : null;

    const record = await this.repository.create({ ...data, total_hours: totalHours });
    logger.info('Attendance record created manually', { id: record.id });
    return record;
  }

  /**
   * Update an attendance record (admin use).
   */
  async updateRecord(id, data) {
    const existing = await this.repository.findById(id);

    const checkIn = data.check_in ?? existing.check_in;
    const checkOut = data.check_out ?? existing.check_out;
    const totalHours = calculateHoursWorked(checkIn, checkOut);

    const updated = await this.repository.update(id, { ...data, total_hours: totalHours });
    logger.info('Attendance record updated', { id });
    return updated;
  }

  /**
   * Delete an attendance record.
   */
  async deleteRecord(id) {
    const result = await this.repository.delete(id);
    logger.info('Attendance record deleted', { id });
    return result;
  }

  /**
   * Get attendance summary for an employee over a date range.
   */
  async getSummary(employee_id, date_from, date_to) {
    // Validate employee exists
    const employee = await this.employeeRepository.findById(employee_id);

    const summary = await this.repository.getSummary(employee_id, date_from, date_to);
    return {
      ...summary,
      employee: {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        employee_code: employee.employee_code,
      },
    };
  }
}

module.exports = AttendanceService;
