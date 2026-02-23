'use strict';

const attendanceService = require('../../services/attendance.service');

/**
 * Attendance records controller.
 */
class AttendanceController {
  async list(req, res, next) {
    try {
      const result = await attendanceService.list(req.query);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const record = await attendanceService.getById(req.params.id);
      return res.status(200).json({ success: true, data: record });
    } catch (err) {
      return next(err);
    }
  }

  async checkIn(req, res, next) {
    try {
      const record = await attendanceService.checkIn(req.body);
      return res.status(201).json({ success: true, data: record });
    } catch (err) {
      return next(err);
    }
  }

  async checkOut(req, res, next) {
    try {
      const record = await attendanceService.checkOut(req.params.id, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (err) {
      return next(err);
    }
  }

  async create(req, res, next) {
    try {
      const record = await attendanceService.create(req.body);
      return res.status(201).json({ success: true, data: record });
    } catch (err) {
      return next(err);
    }
  }

  async update(req, res, next) {
    try {
      const record = await attendanceService.update(req.params.id, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (err) {
      return next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await attendanceService.delete(req.params.id);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }

  async getSummaryReport(req, res, next) {
    try {
      const report = await attendanceService.getSummaryReport(req.query);
      return res.status(200).json({ success: true, data: report });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AttendanceController();
