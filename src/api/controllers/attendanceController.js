'use strict';

const attendanceService = require('../../services/attendanceService');
const { success, created, paginated, noContent } = require('../../utils/response');

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance tracking endpoints
 */

const attendanceController = {
  /**
   * @swagger
   * /attendance:
   *   get:
   *     summary: List attendance records
   *     tags: [Attendance]
   *     parameters:
   *       - in: query
   *         name: employeeId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [present, absent, late, half_day, on_leave]
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *           format: date
   *         example: "2026-02-01"
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *           format: date
   *         example: "2026-02-28"
   *       - in: query
   *         name: department
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Paginated attendance records
   */
  async list(req, res, next) {
    try {
      const { employeeId, status, dateFrom, dateTo, department, page, limit } = req.query;
      const result = await attendanceService.listRecords({
        employeeId,
        status,
        dateFrom,
        dateTo,
        department,
        page,
        limit,
      });
      return paginated(res, result.data, result.page, result.limit, result.total);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /attendance/{id}:
   *   get:
   *     summary: Get an attendance record by ID
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Attendance record details
   *       404:
   *         description: Record not found
   */
  async getById(req, res, next) {
    try {
      const record = await attendanceService.getRecordById(req.params.id);
      return success(res, record);
    } catch (err) {
      next(err);
    }
  },

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
   *             required: [employeeId]
   *             properties:
   *               employeeId:
   *                 type: string
   *                 format: uuid
   *               notes:
   *                 type: string
   *               location:
   *                 type: string
   *                 example: "Office - Floor 3"
   *     responses:
   *       201:
   *         description: Check-in recorded
   *       400:
   *         description: Employee not active or invalid request
   *       409:
   *         description: Already checked in today
   */
  async checkIn(req, res, next) {
    try {
      const { employeeId, notes, location } = req.body;
      const record = await attendanceService.checkIn({ employeeId, notes, location });
      return created(res, record);
    } catch (err) {
      next(err);
    }
  },

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
   *             required: [employeeId]
   *             properties:
   *               employeeId:
   *                 type: string
   *                 format: uuid
   *               notes:
   *                 type: string
   *               location:
   *                 type: string
   *     responses:
   *       200:
   *         description: Check-out recorded with work hours computed
   *       400:
   *         description: No open check-in found for today
   */
  async checkOut(req, res, next) {
    try {
      const { employeeId, notes, location } = req.body;
      const record = await attendanceService.checkOut({ employeeId, notes, location });
      return success(res, record);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /attendance/{id}:
   *   put:
   *     summary: Update an attendance record (admin correction)
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AttendanceRecord'
   *     responses:
   *       200:
   *         description: Updated record
   *       404:
   *         description: Record not found
   */
  async update(req, res, next) {
    try {
      const record = await attendanceService.updateRecord(req.params.id, req.body);
      return success(res, record);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /attendance/{id}:
   *   delete:
   *     summary: Delete an attendance record
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       204:
   *         description: Record deleted
   *       404:
   *         description: Record not found
   */
  async remove(req, res, next) {
    try {
      await attendanceService.deleteRecord(req.params.id);
      return noContent(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /attendance/reports/summary:
   *   get:
   *     summary: Get attendance summary report
   *     tags: [Attendance]
   *     parameters:
   *       - in: query
   *         name: employeeId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: department
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Aggregated attendance stats per employee
   */
  async summaryReport(req, res, next) {
    try {
      const { employeeId, dateFrom, dateTo, department } = req.query;
      const data = await attendanceService.getSummaryReport({ employeeId, dateFrom, dateTo, department });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = attendanceController;
