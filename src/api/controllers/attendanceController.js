const attendanceService = require('../../domain/services/attendanceService');

/**
 * HTTP controller for Attendance endpoints.
 */
class AttendanceController {
  async list(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        employeeId: req.query.employee_id,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        status: req.query.status,
      };
      const result = await attendanceService.getAllRecords(filters);
      return res.json({
        success: true,
        data: result.data.map((r) => r.toJSON()),
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const record = await attendanceService.getRecordById(req.params.id);
      return res.json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  async checkIn(req, res, next) {
    try {
      const record = await attendanceService.checkIn(req.params.employeeId, req.body);
      return res.status(201).json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  async checkOut(req, res, next) {
    try {
      const record = await attendanceService.checkOut(req.params.employeeId, req.body);
      return res.json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const record = await attendanceService.createRecord(req.body);
      return res.status(201).json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const record = await attendanceService.updateRecord(req.params.id, req.body);
      return res.json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await attendanceService.deleteRecord(req.params.id);
      return res.json({ success: true, message: 'Attendance record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttendanceController();
