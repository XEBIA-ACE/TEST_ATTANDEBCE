const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errors');

const TABLE = 'attendance_records';

/**
 * Data Access Layer for Attendance records.
 */
class AttendanceRepository {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * Find attendance records with filters and pagination.
   */
  async findAll({ page = 1, limit = 20, offset = 0, employee_id, date_from, date_to, status } = {}) {
    let query = this.db(TABLE).select(`${TABLE}.*`,
      this.db.raw("employees.first_name || ' ' || employees.last_name as employee_name"),
      'employees.employee_code'
    ).join('employees', `${TABLE}.employee_id`, 'employees.id');

    if (employee_id) query = query.where(`${TABLE}.employee_id`, employee_id);
    if (status) query = query.where(`${TABLE}.status`, status);
    if (date_from) query = query.where(`${TABLE}.date`, '>=', date_from);
    if (date_to) query = query.where(`${TABLE}.date`, '<=', date_to);

    const countQuery = query.clone().clearSelect().count(`${TABLE}.id as count`).first();
    const [{ count }, rows] = await Promise.all([
      countQuery,
      query.clone().orderBy(`${TABLE}.date`, 'desc').limit(limit).offset(offset),
    ]);

    return { rows, total: parseInt(count) };
  }

  /**
   * Find a single attendance record by ID.
   */
  async findById(id) {
    const record = await this.db(TABLE)
      .select(`${TABLE}.*`,
        this.db.raw("employees.first_name || ' ' || employees.last_name as employee_name"),
        'employees.employee_code'
      )
      .join('employees', `${TABLE}.employee_id`, 'employees.id')
      .where(`${TABLE}.id`, id)
      .first();

    if (!record) throw new NotFoundError('Attendance record');
    return record;
  }

  /**
   * Find today's attendance record for an employee.
   */
  async findTodayRecord(employee_id) {
    const today = new Date().toISOString().split('T')[0];
    return this.db(TABLE).where({ employee_id, date: today }).first();
  }

  /**
   * Find attendance record for a specific employee and date.
   */
  async findByEmployeeAndDate(employee_id, date) {
    return this.db(TABLE).where({ employee_id, date }).first();
  }

  /**
   * Create a new attendance record.
   */
  async create(data) {
    const existing = await this.findByEmployeeAndDate(data.employee_id, data.date);
    if (existing) {
      throw new ConflictError(`Attendance record for employee on ${data.date} already exists`);
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const record = { id, ...data, created_at: now, updated_at: now };

    await this.db(TABLE).insert(record);
    return this.findById(id);
  }

  /**
   * Update an attendance record.
   */
  async update(id, data) {
    await this.findById(id); // Ensures record exists
    await this.db(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date().toISOString() });
    return this.findById(id);
  }

  /**
   * Delete an attendance record permanently.
   */
  async delete(id) {
    await this.findById(id);
    await this.db(TABLE).where({ id }).delete();
    return { id, deleted: true };
  }

  /**
   * Aggregate attendance summary for an employee over a date range.
   */
  async getSummary(employee_id, date_from, date_to) {
    const rows = await this.db(TABLE)
      .where({ employee_id })
      .where('date', '>=', date_from)
      .where('date', '<=', date_to)
      .select('status')
      .count('id as count')
      .sum('total_hours as total_hours')
      .groupBy('status');

    const summary = {
      employee_id,
      date_from,
      date_to,
      total_days: 0,
      total_hours: 0,
      by_status: {},
    };

    for (const row of rows) {
      summary.by_status[row.status] = parseInt(row.count);
      summary.total_days += parseInt(row.count);
      summary.total_hours += parseFloat(row.total_hours || 0);
    }

    summary.total_hours = parseFloat(summary.total_hours.toFixed(2));
    return summary;
  }
}

module.exports = AttendanceRepository;
