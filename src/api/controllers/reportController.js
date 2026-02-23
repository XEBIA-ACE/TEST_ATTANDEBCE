const reportService = require('../../domain/services/reportService');

/**
 * HTTP controller for reporting endpoints.
 */
class ReportController {
  async employeeSummary(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { start_date, end_date } = req.query;
      const report = await reportService.getEmployeeSummary(employeeId, start_date, end_date);
      return res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async departmentSummary(req, res, next) {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const report = await reportService.getDepartmentSummary(date);
      return res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
