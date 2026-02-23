'use strict';

const { db } = require('../db');

const TABLE = 'attendance_records';
const EMPLOYEE_TABLE = 'employees';

/**
 * Data Access Layer for attendance records.
 */
const attendanceRepository = {
  /**
   * Find records with filters and pagination, joined with employee data.
   */
  async findAll({ employeeId, status, dateFrom, dateTo, department, page = 1, limit = 20 } = {}) {
    const query = db(TABLE)
      .join(EMPLOYEE_TABLE, `${TABLE}.employee_id`, `${EMPLOYEE_TABLE}.id`)
      .select(
        `${TABLE}.*`,
        `${EMPLOYEE_TABLE}.first_name`,
        `${EMPLOYEE_TABLE}.last_name`,
        `${EMPLOYEE_TABLE}.email`,
        `${EMPLOYEE_TABLE}.employee_code`,
        `${EMPLOYEE_TABLE}.department`
      )
      .orderBy(`${TABLE}.date`, 'desc')
      .orderBy(`${TABLE}.check_in`, 'desc');

    if (employeeId) query.where(`${TABLE}.employee_id`, employeeId);
    if (status) query.where(`${TABLE}.status`, status);
    if (dateFrom) query.where(`${TABLE}.date`, '>=', dateFrom);
    if (dateTo) query.where(`${TABLE}.date`, '<=', dateTo);
    if (department) query.where(`${EMPLOYEE_TABLE}.department`, department);

    const [{ count }] = await query.clone().count(`${TABLE}.id as count`);
    const total = parseInt(count, 10);

    const offset = (page - 1) * limit;
    const data = await query.limit(limit).offset(offset);

    return { data, total };
  },

  async findById(id) {
    return db(TABLE)
      .join(EMPLOYEE_TABLE, `${TABLE}.employee_id`, `${EMPLOYEE_TABLE}.id`)
      .select(
        `${TABLE}.*`,
        `${EMPLOYEE_TABLE}.first_name`,
        `${EMPLOYEE_TABLE}.last_name`,
        `${EMPLOYEE_TABLE}.email`,
        `${EMPLOYEE_TABLE}.employee_code`,
        `${EMPLOYEE_TABLE}.department`
      )
      .where(`${TABLE}.id`, id)
      .first();
  },

  /**
   * Find a specific employee's record for a given date.
   * Used to enforce the one-record-per-day constraint.
   */
  async findByEmployeeAndDate(employeeId, date) {
    return db(TABLE).where({ employee_id: employeeId, date }).first();
  },

  /**
   * Find the most recent open record (check-in without check-out) for an employee.
   */
  async findOpenRecord(employeeId) {
    return db(TABLE)
      .where({ employee_id: employeeId })
      .whereNotNull('check_in')
      .whereNull('check_out')
      .orderBy('check_in', 'desc')
      .first();
  },

  async create(data) {
    const [record] = await db(TABLE).insert(data).returning('*');
    return record;
  },

  async update(id, data) {
    const [record] = await db(TABLE)
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return record;
  },

  async delete(id) {
    return db(TABLE).where({ id }).delete();
  },

  /**
   * Aggregate summary statistics for reporting.
   */
  async getSummaryReport({ employeeId, dateFrom, dateTo, department } = {}) {
    const query = db(TABLE)
      .join(EMPLOYEE_TABLE, `${TABLE}.employee_id`, `${EMPLOYEE_TABLE}.id`)
      .select(
        `${EMPLOYEE_TABLE}.id as employee_id`,
        `${EMPLOYEE_TABLE}.employee_code`,
        `${EMPLOYEE_TABLE}.first_name`,
        `${EMPLOYEE_TABLE}.last_name`,
        `${EMPLOYEE_TABLE}.department`
      )
      .count(`${TABLE}.id as total_records`)
      .sum('work_hours as total_hours')
      .avg('work_hours as avg_hours')
      .countDistinct(db.raw(`CASE WHEN ${TABLE}.status = 'present' THEN ${TABLE}.id END as present_count`))
      .countDistinct(db.raw(`CASE WHEN ${TABLE}.status = 'absent' THEN ${TABLE}.id END as absent_count`))
      .countDistinct(db.raw(`CASE WHEN ${TABLE}.status = 'late' THEN ${TABLE}.id END as late_count`))
      .groupBy(
        `${EMPLOYEE_TABLE}.id`,
        `${EMPLOYEE_TABLE}.employee_code`,
        `${EMPLOYEE_TABLE}.first_name`,
        `${EMPLOYEE_TABLE}.last_name`,
        `${EMPLOYEE_TABLE}.department`
      )
      .orderBy(`${EMPLOYEE_TABLE}.last_name`);

    if (employeeId) query.where(`${TABLE}.employee_id`, employeeId);
    if (dateFrom) query.where(`${TABLE}.date`, '>=', dateFrom);
    if (dateTo) query.where(`${TABLE}.date`, '<=', dateTo);
    if (department) query.where(`${EMPLOYEE_TABLE}.department`, department);

    return query;
  },
};

module.exports = attendanceRepository;
