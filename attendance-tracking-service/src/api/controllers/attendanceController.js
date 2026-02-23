'use strict';

const AttendanceService = require('../../domain/services/attendanceService');

/**
 * HTTP controller for Attendance endpoints.
 */
class AttendanceController {
  constructor(attendanceService = null) {
    this.service = attendanceService || new AttendanceService();

    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.checkIn = this.checkIn.bind(this);
    this.checkOut = this.checkOut.bind(this);
    this.upsert = this.upsert.bind(this);
    this.remove = this.remove.bind(this);
    this.getEmployeeSummary = this.getEmployeeSummary.bind(this);
    this.getDepartmentReport = this.getDepartmentReport.bind(this);
  }

  /**
   * @swagger
   * /attendance:
   *   get:
   *     summary: List attendance records
   *     tags: [Attendance]
   *     parameters:
   *       - in: query
   *         name: employee_id
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: date_from
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: date_to
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [present, absent, late, half_day, on_leave] }
   *     responses:
   *       200:
   *         description: Paginated attendance records
   */
  async list(req, res, next) {
    try {
      const result = await this.service.listAttendance(req.query);
      res.json({
        success: true,
        data: result.data.map((r) => r.toJSON()),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /attendance/{id}:
   *   get:
   *     summary: Get attendance record by ID
   *     tags: [Attendance]
   *     responses:
   *       200:
   *         description: Attendance record
   *       404:
   *         description: Record not found
   */
  async getById(req, res, next) {
    try {
      const record = await this.service.getAttendanceRecord(req.params.id);
      res.json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /attendance/check-in:
   *   post:
   *     summary: Record employee check-in
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [employee_id]
   *             properties:
   *               employee_id: { type: string, format: uuid }
   *               check_in: { type: string, format: date-time }
   *               notes: { type: string }
   *     responses:
   *       201:
   *         description: Check-in recorded
   *       409:
   *         description: Already checked in today
   */
  async checkIn(req, res, next) {
    try {
      const { employee_id, ...data } = req.body;
      const record = await this.service.checkIn(employee_id, data);
      res.status(201).json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /attendance/check-out:
   *   post:
   *     summary: Record employee check-out
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [employee_id]
   *             properties:
   *               employee_id: { type: string, format: uuid }
   *               check_out: { type: string, format: date-time }
   *               notes: { type: string }
   *     responses:
   *       200:
   *         description: Check-out recorded
   *       400:
   *         description: No check-in found or already checked out
   */
  async checkOut(req, res, next) {
    try {
      const { employee_id, ...data } = req.body;
      const record = await this.service.checkOut(employee_id, data);
      res.json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /attendance/{employeeId}/{date}:
   *   put:
   *     summary: Create or update attendance record for an employee on a specific date (admin)
   *     tags: [Attendance]
   */
  async upsert(req, res, next) {
    try {
      const { employeeId, date } = req.params;
      const record = await this.service.upsertAttendance(employeeId, date, req.body);
      res.json({ success: true, data: record.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /attendance/{id}:
   *   delete:
   *     summary: Delete an attendance record
   *     tags: [Attendance]
   */
  async remove(req, res, next) {
    try {
      const result = await this.service.deleteAttendanceRecord(req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /attendance/reports/employee/{employeeId}:
   *   get:
   *     summary: Get attendance summary for an employee
   *     tags: [Reports]
   *     parameters:
   *       - in: path
   *         name: employeeId
   *         required: true
   *       - in: query
   *         name: date_from
   *         required: true
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: date_to
   *         required: true
   *         schema: { type: string, format: date }
   */
  async getEmployeeSummary(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { date_from, date_to } = req.query;
      const summary = await this.service.getEmployeeSummary(employeeId, date_from, date_to);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /attendance/reports/department:
   *   get:
   *     summary: Get department-level attendance report for a date
   *     tags: [Reports]
   *     parameters:
   *       - in: query
   *         name: date
   *         required: true
   *         schema: { type: string, format: date }
   */
  async getDepartmentReport(req, res, next) {
    try {
      const { date } = req.query;
      const report = await this.service.getDepartmentReport(date);
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AttendanceController;
