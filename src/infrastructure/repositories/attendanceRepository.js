const db = require('../../config/database');
const Attendance = require('../../domain/models/Attendance');

const TABLE = 'attendance_records';

/**
 * Data access layer for AttendanceRecord entities.
 */
class AttendanceRepository {
  async findAll({ page = 1, limit = 20, employeeId, startDate, endDate, status } = {}) {
    const offset = (page - 1) * limit;
    const query = db(TABLE);

    if (employeeId) query.where({ employee_id: employeeId });
    if (status) query.where({ status });
    if (startDate) query.where('date', '>=', startDate);
    if (endDate) query.where('date', '<=', endDate);

    const [{ count }] = await query.clone().count('id as count');
    const rows = await query
      .orderBy('date', 'desc')
      .orderBy('check_in', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map(Attendance.fromDB),
      pagination: {
        page,
        limit,
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / limit),
      },
    };
  }

  async findById(id) {
    const row = await db(TABLE).where({ id }).first();
    return row ? Attendance.fromDB(row) : null;
  }

  /**
   * Finds the active (not checked-out) record for an employee today.
   * Used to enforce single-session-per-day business rule.
   */
  async findActiveCheckIn(employeeId, date) {
    const row = await db(TABLE)
      .where({ employee_id: employeeId, date })
      .whereNull('check_out')
      .first();
    return row ? Attendance.fromDB(row) : null;
  }

  async findByEmployeeAndDate(employeeId, date) {
    const row = await db(TABLE).where({ employee_id: employeeId, date }).first();
    return row ? Attendance.fromDB(row) : null;
  }

  async create(data) {
    const [row] = await db(TABLE).insert(data).returning('*');
    return Attendance.fromDB(row);
  }

  async update(id, data) {
    const [row] = await db(TABLE)
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return row ? Attendance.fromDB(row) : null;
  }

  async delete(id) {
    const count = await db(TABLE).where({ id }).delete();
    return count > 0;
  }

  /**
   * Aggregated summary for an employee over a date range.
   * Used by the reporting service.
   */
  async getSummaryByEmployee(employeeId, startDate, endDate) {
    return db(TABLE)
      .where({ employee_id: employeeId })
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .select(
        db.raw('COUNT(*) as total_days'),
        db.raw("COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days"),
        db.raw("COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days"),
        db.raw("COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days"),
        db.raw("COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_days"),
        db.raw("COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as leave_days"),
        db.raw(
          'ROUND(CAST(SUM(EXTRACT(EPOCH FROM (check_out - check_in)) / 3600) AS NUMERIC), 2) as total_hours'
        )
      )
      .first();
  }

  /**
   * Department-level attendance summary for a given date.
   */
  async getDepartmentSummary(date) {
    return db(TABLE)
      .join('employees', 'attendance_records.employee_id', 'employees.id')
      .where('attendance_records.date', date)
      .whereNull('employees.deleted_at')
      .groupBy('employees.department')
      .select(
        'employees.department',
        db.raw('COUNT(*) as total'),
        db.raw("COUNT(CASE WHEN attendance_records.status = 'present' THEN 1 END) as present"),
        db.raw("COUNT(CASE WHEN attendance_records.status = 'absent' THEN 1 END) as absent"),
        db.raw("COUNT(CASE WHEN attendance_records.status = 'late' THEN 1 END) as late")
      );
  }
}

module.exports = new AttendanceRepository();
