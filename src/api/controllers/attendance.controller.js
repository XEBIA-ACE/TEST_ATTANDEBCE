const attendanceService = require('../../services/attendance.service');
const { sendSuccess, sendCreated, sendNoContent, paginationMeta } = require('../../utils/response');

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance tracking endpoints
 */
class AttendanceController {
  /**
   * @swagger
   * /api/v1/attendance:
   *   get:
   *     summary: List attendance records
   *     tags: [Attendance]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: employeeId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: startDate
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: endDate
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: status
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Paginated list of attendance records
   */
  async list(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const { count, records } = await attendanceService.listRecords({ page, limit, ...filters });
      return sendSuccess(res, records, {
        meta: paginationMeta({ count, page, limit }),
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/{id}:
   *   get:
   *     summary: Get an attendance record by ID
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Attendance record
   *       404:
   *         description: Record not found
   */
  async get(req, res, next) {
    try {
      const record = await attendanceService.getRecord(req.params.id);
      return sendSuccess(res, record);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/clock-in:
   *   post:
   *     summary: Clock in an employee
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClockIn'
   *     responses:
   *       201:
   *         description: Clock-in recorded
   *       409:
   *         description: Already clocked in
   */
  async clockIn(req, res, next) {
    try {
      const { employeeId, ...rest } = req.body;
      const record = await attendanceService.clockIn(employeeId, rest);
      return sendCreated(res, record, 'Clock-in recorded successfully');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/clock-out:
   *   post:
   *     summary: Clock out an employee
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClockOut'
   *     responses:
   *       200:
   *         description: Clock-out recorded
   *       400:
   *         description: No active clock-in session
   */
  async clockOut(req, res, next) {
    try {
      const { employeeId, ...rest } = req.body;
      const record = await attendanceService.clockOut(employeeId, rest);
      return sendSuccess(res, record, { message: 'Clock-out recorded successfully' });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/break/start:
   *   post:
   *     summary: Start a break for an active session
   *     tags: [Attendance]
   */
  async startBreak(req, res, next) {
    try {
      const record = await attendanceService.startBreak(req.body.employeeId);
      return sendSuccess(res, record, { message: 'Break started' });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/break/end:
   *   post:
   *     summary: End a break for an active session
   *     tags: [Attendance]
   */
  async endBreak(req, res, next) {
    try {
      const record = await attendanceService.endBreak(req.body.employeeId);
      return sendSuccess(res, record, { message: 'Break ended' });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/manual:
   *   post:
   *     summary: Create a manual attendance record (admin)
   *     tags: [Attendance]
   */
  async createManual(req, res, next) {
    try {
      // In production, adminEmployeeId would come from req.user.sub
      const adminEmployeeId = req.user?.sub || null;
      const record = await attendanceService.createManualRecord(req.body, adminEmployeeId);
      return sendCreated(res, record, 'Manual attendance record created');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/{id}:
   *   patch:
   *     summary: Update an attendance record
   *     tags: [Attendance]
   */
  async update(req, res, next) {
    try {
      const record = await attendanceService.updateRecord(req.params.id, req.body);
      return sendSuccess(res, record, { message: 'Attendance record updated' });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/{id}:
   *   delete:
   *     summary: Delete an attendance record
   *     tags: [Attendance]
   */
  async delete(req, res, next) {
    try {
      await attendanceService.deleteRecord(req.params.id);
      return sendNoContent(res);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/attendance/summary:
   *   get:
   *     summary: Get attendance summary/report
   *     tags: [Attendance]
   */
  async summary(req, res, next) {
    try {
      const data = await attendanceService.getSummary(req.query);
      return sendSuccess(res, data);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AttendanceController();
