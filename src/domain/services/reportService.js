const attendanceRepository = require('../../infrastructure/repositories/attendanceRepository');
const employeeRepository = require('../../infrastructure/repositories/employeeRepository');

/**
 * Reporting service — aggregates attendance data for analytics.
 * All methods are read-only and delegate aggregation to the repository layer.
 */
class ReportService {
  /**
   * Generates an individual attendance summary for an employee.
   * Useful for payroll and HR reviews.
   */
  async getEmployeeSummary(employeeId, startDate, endDate) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    const summary = await attendanceRepository.getSummaryByEmployee(
      employeeId,
      startDate,
      endDate
    );

    return {
      employee: employee.toJSON(),
      period: { start_date: startDate, end_date: endDate },
      summary: {
        total_days: parseInt(summary.total_days) || 0,
        present_days: parseInt(summary.present_days) || 0,
        absent_days: parseInt(summary.absent_days) || 0,
        late_days: parseInt(summary.late_days) || 0,
        half_days: parseInt(summary.half_days) || 0,
        leave_days: parseInt(summary.leave_days) || 0,
        total_hours: parseFloat(summary.total_hours) || 0,
        attendance_rate: this._calculateRate(
          parseInt(summary.present_days) + parseInt(summary.late_days),
          parseInt(summary.total_days)
        ),
      },
    };
  }

  /**
   * Generates a department-level attendance summary for a specific date.
   * Useful for daily stand-up dashboards.
   */
  async getDepartmentSummary(date) {
    const rows = await attendanceRepository.getDepartmentSummary(date);
    return {
      date,
      departments: rows.map((r) => ({
        department: r.department,
        total: parseInt(r.total),
        present: parseInt(r.present),
        absent: parseInt(r.absent),
        late: parseInt(r.late),
        attendance_rate: this._calculateRate(
          parseInt(r.present) + parseInt(r.late),
          parseInt(r.total)
        ),
      })),
    };
  }

  _calculateRate(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100 * 100) / 100;
  }
}

module.exports = new ReportService();
