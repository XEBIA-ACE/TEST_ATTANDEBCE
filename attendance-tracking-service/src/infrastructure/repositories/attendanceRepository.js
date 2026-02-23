'use strict';

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../config/database');
const Attendance = require('../../domain/models/Attendance');
const AppError = require('../../utils/AppError');

const TABLE = 'attendance_records';

/**
 * Data access layer for Attendance records.
 */
class AttendanceRepository {
  constructor(db = null) {
    this._db = db;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Retrieves attendance records with filtering, joining employee data.
   */
  async findAll({ page = 1, limit = 20, employee_id, date_from, date_to, status } = {}) {
    const offset = (page - 1) * limit;

    let query = this.db(TABLE).select(
      `${TABLE}.*`,
      'e.first_name',
      'e.last_name',
      'e.employee_number'
    ).join('employees as e', `${TABLE}.employee_id`, 'e.id');

    if (employee_id) query = query.where(`${TABLE}.employee_id`, employee_id);
    if (status) query = query.where(`${TABLE}.status`, status);
    if (date_from) query = query.where(`${TABLE}.date`, '>=', date_from);
    if (date_to) query = query.where(`${TABLE}.date`, '<=', date_to);

    const [{ count }] = await query.clone().count(`${TABLE}.id as count`);
    const rows = await query
      .orderBy(`${TABLE}.date`, 'desc')
      .orderBy(`${TABLE}.check_in`, 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((row) => new Attendance(row)),
      total: parseInt(count, 10),
      page,
      limit,
    };
  }

  /**
   * Retrieves a single attendance record by ID.
   * @throws {AppError} 404 if not found.
   */
  async findById(id) {
    const row = await this.db(TABLE).where({ id }).first();
    if (!row) throw AppError.notFound(`Attendance record with id '${id}' not found`);
    return new Attendance(row);
  }

  /**
   * Finds today's attendance record for a specific employee.
   */
  async findTodayByEmployeeId(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    const row = await this.db(TABLE)
      .where({ employee_id: employeeId, date: today })
      .first();
    return row ? new Attendance(row) : null;
  }

  /**
   * Finds an attendance record for a specific employee on a specific date.
   */
  async findByEmployeeAndDate(employeeId, date) {
    const row = await this.db(TABLE)
      .where({ employee_id: employeeId, date })
      .first();
    return row ? new Attendance(row) : null;
  }

  /**
   * Creates a new attendance record (check-in).
   */
  async create(data) {
    const id = uuidv4();
    const now = new Date();

    const payload = {
      id,
      employee_id: data.employee_id,
      date: data.date || now.toISOString().split('T')[0],
      check_in: data.check_in || now,
      check_out: data.check_out || null,
      status: data.status || Attendance.STATUS.PRESENT,
      total_hours: data.total_hours || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    };

    await this.db(TABLE).insert(payload);
    return this.findById(id);
  }

  /**
   * Updates an existing attendance record (e.g., recording check-out).
   */
  async update(id, data) {
    await this.findById(id); // Ensures record exists
    await this.db(TABLE).where({ id }).update({ ...data, updated_at: new Date() });
    return this.findById(id);
  }

  /**
   * Deletes an attendance record permanently.
   */
  async delete(id) {
    await this.findById(id);
    await this.db(TABLE).where({ id }).del();
    return true;
  }

  /**
   * Generates an attendance summary report for an employee over a date range.
   */
  async getSummaryByEmployee(employeeId, dateFrom, dateTo) {
    const rows = await this.db(TABLE)
      .where({ employee_id: employeeId })
      .whereBetween('date', [dateFrom, dateTo])
      .select('status', this.db.raw('COUNT(*) as count'), this.db.raw('SUM(total_hours) as total_hours'));

    const grouped = {};
    for (const row of rows) {
      grouped[row.status] = {
        count: parseInt(row.count, 10),
        total_hours: parseFloat(row.total_hours) || 0,
      };
    }
    return grouped;
  }

  /**
   * Returns department-level attendance statistics for a date.
   */
  async getDepartmentStats(date) {
    return this.db(TABLE)
      .join('employees as e', `${TABLE}.employee_id`, 'e.id')
      .where(`${TABLE}.date`, date)
      .whereNull('e.deleted_at')
      .select('e.department', `${TABLE}.status`, this.db.raw('COUNT(*) as count'))
      .groupBy('e.department', `${TABLE}.status`)
      .orderBy('e.department');
  }
}

module.exports = AttendanceRepository;
