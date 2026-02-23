'use strict';

const { getDatabase } = require('../config/database');

const TABLE = 'attendance_records';

/**
 * Data-access layer for the attendance_records table.
 */
class AttendanceRepository {
  get db() {
    return getDatabase();
  }

  /** @returns {Promise<{ rows: object[], total: number }>} */
  async findAll({ page = 1, limit = 20, employeeId, startDate, endDate, status } = {}) {
    const offset = (page - 1) * limit;

    const query = this.db(TABLE)
      .select([
        `${TABLE}.*`,
        this.db.raw("CONCAT(e.first_name, ' ', e.last_name) AS employee_name"),
        'e.employee_code',
        'e.department',
      ])
      .join('employees AS e', `${TABLE}.employee_id`, 'e.id');

    if (employeeId) query.where(`${TABLE}.employee_id`, employeeId);
    if (status) query.where(`${TABLE}.status`, status);
    if (startDate) query.where(`${TABLE}.date`, '>=', startDate);
    if (endDate) query.where(`${TABLE}.date`, '<=', endDate);

    const countQuery = query.clone().clearSelect().count('* as count').first();
    const [{ count }, rows] = await Promise.all([
      countQuery,
      query.orderBy(`${TABLE}.date`, 'desc').limit(limit).offset(offset),
    ]);

    return { rows, total: Number(count) };
  }

  /** @returns {Promise<object|null>} */
  async findById(id) {
    return (
      this.db(TABLE)
        .select([
          `${TABLE}.*`,
          this.db.raw("CONCAT(e.first_name, ' ', e.last_name) AS employee_name"),
          'e.employee_code',
        ])
        .join('employees AS e', `${TABLE}.employee_id`, 'e.id')
        .where(`${TABLE}.id`, id)
        .first() || null
    );
  }

  /**
   * Find the attendance record for a specific employee on a specific date.
   * Used by check-in/out to detect duplicate entries.
   */
  async findByEmployeeAndDate(employeeId, date) {
    return this.db(TABLE).where({ employee_id: employeeId, date }).first() || null;
  }

  /** @returns {Promise<object>} */
  async create(data) {
    const [record] = await this.db(TABLE).insert(data).returning('*');
    return record;
  }

  /** @returns {Promise<object|null>} */
  async update(id, data) {
    const [record] = await this.db(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return record || null;
  }

  /** @returns {Promise<boolean>} */
  async delete(id) {
    const count = await this.db(TABLE).where({ id }).delete();
    return count > 0;
  }

  /**
   * Aggregated attendance summary per employee for a date range.
   * Used by the reporting endpoint.
   */
  async getReport({ employeeId, startDate, endDate, department } = {}) {
    const query = this.db(TABLE)
      .select([
        'e.id AS employee_id',
        'e.employee_code',
        this.db.raw("CONCAT(e.first_name, ' ', e.last_name) AS employee_name"),
        'e.department',
        this.db.raw('COUNT(*) AS total_days'),
        this.db.raw("SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present_days"),
        this.db.raw("SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent_days"),
        this.db.raw("SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late_days"),
        this.db.raw("SUM(CASE WHEN ar.status = 'half_day' THEN 1 ELSE 0 END) AS half_days"),
        this.db.raw("SUM(CASE WHEN ar.status = 'on_leave' THEN 1 ELSE 0 END) AS leave_days"),
        this.db.raw('ROUND(AVG(ar.work_hours), 2) AS avg_work_hours'),
        this.db.raw('ROUND(SUM(ar.work_hours), 2) AS total_work_hours'),
      ])
      .from(`${TABLE} AS ar`)
      .join('employees AS e', 'ar.employee_id', 'e.id')
      .groupBy('e.id', 'e.employee_code', 'e.first_name', 'e.last_name', 'e.department');

    if (employeeId) query.where('ar.employee_id', employeeId);
    if (startDate) query.where('ar.date', '>=', startDate);
    if (endDate) query.where('ar.date', '<=', endDate);
    if (department) query.where('e.department', department);

    return query.orderBy('e.employee_code');
  }
}

module.exports = new AttendanceRepository();
