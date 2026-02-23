'use strict';

const attendanceService = require('../../services/attendanceService');
const { sendSuccess, buildPaginationMeta } = require('../../utils/response');

/**
 * HTTP handlers for /api/v1/attendance.
 */
const attendanceController = {
  /**
   * GET /attendance
   */
  async list(req, res, next) {
    try {
      const { records, total, page, limit } = await attendanceService.listRecords(req.query);
      const meta = buildPaginationMeta(page, limit, total);
      return sendSuccess(res, records, 'Attendance records retrieved successfully', 200, meta);
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /attendance/:id
   */
  async getById(req, res, next) {
    try {
      const record = await attendanceService.getRecord(req.params.id);
      return sendSuccess(res, record, 'Attendance record retrieved successfully');
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /attendance/check-in
   */
  async checkIn(req, res, next) {
    try {
      const { employee_id, check_in_time, notes } = req.body;
      const record = await attendanceService.checkIn(employee_id, { checkInTime: check_in_time, notes });
      return sendSuccess(res, record, 'Check-in recorded successfully', 201);
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /attendance/check-out
   */
  async checkOut(req, res, next) {
    try {
      const { employee_id, check_out_time, notes } = req.body;
      const record = await attendanceService.checkOut(employee_id, { checkOutTime: check_out_time, notes });
      return sendSuccess(res, record, 'Check-out recorded successfully');
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /attendance/employees/:employeeId/:date
   * Manual / administrative upsert of an attendance record.
   */
  async upsert(req, res, next) {
    try {
      const { employeeId, date } = req.params;
      const record = await attendanceService.upsertRecord(employeeId, date, req.body);
      return sendSuccess(res, record, 'Attendance record saved successfully', 200);
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /attendance/:id
   */
  async remove(req, res, next) {
    try {
      await attendanceService.deleteRecord(req.params.id);
      return sendSuccess(res, null, 'Attendance record deleted successfully');
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /attendance/report
   * Aggregated attendance report with query filters.
   */
  async report(req, res, next) {
    try {
      const data = await attendanceService.getReport(req.query);
      return sendSuccess(res, data, 'Report generated successfully');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = attendanceController;
