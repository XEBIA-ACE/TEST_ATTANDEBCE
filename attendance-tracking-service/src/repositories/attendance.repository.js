'use strict';

const { query } = require('../config/database');
const { AttendanceRecord } = require('../models/attendance.model');

/**
 * Data-access layer for attendance records.
 */
class AttendanceRepository {
  /**
   * Paginated list with optional filters, joined with employee name for convenience.
   */
  async findAll({ page = 1, limit = 20, employeeId, startDate, endDate, status, department } = {}) {
    const params = [];
    const conditions = [];

    if (employeeId) {
      params.push(employeeId);
      conditions.push(`ar.employee_id = $${params.length}`);
    }
    if (startDate) {
      params.push(startDate);
      conditions.push(`ar.date >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`ar.date <= $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`ar.status = $${params.length}`);
    }
    if (department) {
      params.push(department);
      conditions.push(`e.department = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*)
       FROM attendance_records ar
       JOIN employees e ON e.id = ar.employee_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const result = await query(
      `SELECT ar.*, e.employee_code, e.first_name, e.last_name, e.department
       FROM attendance_records ar
       JOIN employees e ON e.id = ar.employee_id
       ${where}
       ORDER BY ar.date DESC, ar.check_in_time DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      records: result.rows.map(AttendanceRecord.fromRow),
      total,
    };
  }

  /**
   * Find a single record by ID.
   */
  async findById(id) {
    const result = await query(
      `SELECT ar.*, e.employee_code, e.first_name, e.last_name, e.department
       FROM attendance_records ar
       JOIN employees e ON e.id = ar.employee_id
       WHERE ar.id = $1`,
      [id]
    );
    return result.rows.length ? AttendanceRecord.fromRow(result.rows[0]) : null;
  }

  /**
   * Find today's record for an employee (used during check-in/out).
   */
  async findByEmployeeAndDate(employeeId, date) {
    const result = await query(
      `SELECT ar.*, e.employee_code, e.first_name, e.last_name, e.department
       FROM attendance_records ar
       JOIN employees e ON e.id = ar.employee_id
       WHERE ar.employee_id = $1 AND ar.date = $2`,
      [employeeId, date]
    );
    return result.rows.length ? AttendanceRecord.fromRow(result.rows[0]) : null;
  }

  /**
   * Create a new attendance record.
   */
  async create(data) {
    const { employee_id, date, check_in_time, status, notes } = data;
    const result = await query(
      `INSERT INTO attendance_records (employee_id, date, check_in_time, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [employee_id, date, check_in_time, status, notes]
    );
    return this.findById(result.rows[0].id);
  }

  /**
   * Partial update – only sets provided fields.
   */
  async update(id, updates) {
    const allowed = ['check_in_time', 'check_out_time', 'status', 'notes'];
    const setClauses = [];
    const params = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        params.push(updates[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    await query(
      `UPDATE attendance_records SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
      params
    );
    return this.findById(id);
  }

  /**
   * Delete a record by ID.
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM attendance_records WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  /**
   * Summary/report: aggregate hours and counts per employee for a date range.
   */
  async getSummaryReport({ startDate, endDate, department, employeeId } = {}) {
    const params = [];
    const conditions = [];

    if (startDate) {
      params.push(startDate);
      conditions.push(`ar.date >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`ar.date <= $${params.length}`);
    }
    if (department) {
      params.push(department);
      conditions.push(`e.department = $${params.length}`);
    }
    if (employeeId) {
      params.push(employeeId);
      conditions.push(`ar.employee_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         e.id            AS employee_id,
         e.employee_code,
         e.first_name,
         e.last_name,
         e.department,
         COUNT(*)                                                    AS total_days,
         SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END)     AS present_days,
         SUM(CASE WHEN ar.status = 'absent'  THEN 1 ELSE 0 END)     AS absent_days,
         SUM(CASE WHEN ar.status = 'late'    THEN 1 ELSE 0 END)     AS late_days,
         SUM(CASE WHEN ar.status = 'half_day' THEN 1 ELSE 0 END)    AS half_days,
         ROUND(SUM(COALESCE(ar.total_hours, 0))::numeric, 2)        AS total_hours,
         ROUND(AVG(NULLIF(ar.total_hours, 0))::numeric, 2)          AS avg_hours_per_day
       FROM attendance_records ar
       JOIN employees e ON e.id = ar.employee_id
       ${where}
       GROUP BY e.id, e.employee_code, e.first_name, e.last_name, e.department
       ORDER BY e.last_name, e.first_name`,
      params
    );

    return result.rows;
  }
}

module.exports = new AttendanceRepository();
