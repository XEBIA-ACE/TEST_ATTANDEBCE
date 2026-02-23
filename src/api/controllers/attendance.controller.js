'use strict';

const attendanceService = require('../../business/services/attendance.service');
const ResponseHelper = require('../../utils/response.helper');

/**
 * AttendanceController maps HTTP requests to AttendanceService calls.
 */
class AttendanceController {
  async list(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const { records, total } = await attendanceService.listAttendance(filters, page, limit);

      return ResponseHelper.success(res, {
        message: 'Attendance records retrieved successfully',
        data: records,
        meta: ResponseHelper.paginationMeta(total, page, limit),
      });
    } catch (err) {
      return next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const record = await attendanceService.getAttendance(req.params.id);
      return ResponseHelper.success(res, {
        message: 'Attendance record retrieved successfully',
        data: record,
      });
    } catch (err) {
      return next(err);
    }
  }

  async checkIn(req, res, next) {
    try {
      // Client IP for audit trail (works with reverse proxies when trust proxy is enabled)
      const ip = req.ip || req.connection.remoteAddress;
      const record = await attendanceService.checkIn(req.body.employeeId, ip);
      return ResponseHelper.created(res, {
        message: 'Check-in recorded successfully',
        data: record,
      });
    } catch (err) {
      return next(err);
    }
  }

  async checkOut(req, res, next) {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const record = await attendanceService.checkOut(req.body.employeeId, ip);
      return ResponseHelper.success(res, {
        message: 'Check-out recorded successfully',
        data: record,
      });
    } catch (err) {
      return next(err);
    }
  }

  async create(req, res, next) {
    try {
      const record = await attendanceService.createAttendance(req.body);
      return ResponseHelper.created(res, {
        message: 'Attendance record created successfully',
        data: record,
      });
    } catch (err) {
      return next(err);
    }
  }

  async update(req, res, next) {
    try {
      const record = await attendanceService.updateAttendance(req.params.id, req.body);
      return ResponseHelper.success(res, {
        message: 'Attendance record updated successfully',
        data: record,
      });
    } catch (err) {
      return next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await attendanceService.deleteAttendance(req.params.id);
      return ResponseHelper.success(res, { message: 'Attendance record deleted successfully' });
    } catch (err) {
      return next(err);
    }
  }

  async getReport(req, res, next) {
    try {
      const report = await attendanceService.getReport(
        req.query.employeeId || null,
        req.query.startDate,
        req.query.endDate
      );
      return ResponseHelper.success(res, {
        message: 'Attendance report generated successfully',
        data: report,
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AttendanceController();
