const attendanceService = require('../../business/services/attendanceService');

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance check-in / check-out and reporting endpoints
 */

/**
 * @swagger
 * /v1/attendance/check-in:
 *   post:
 *     summary: Record an employee check-in
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckInRequest'
 *     responses:
 *       201:
 *         description: Check-in recorded
 *       400:
 *         description: Employee already checked in today
 *       404:
 *         description: Employee not found
 */
const checkIn = async (req, res, next) => {
  try {
    const record = await attendanceService.checkIn(req.body);
    res.status(201).json({ status: 'success', data: { record } });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/attendance/{id}/check-out:
 *   patch:
 *     summary: Record a check-out for an existing attendance record
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckOutRequest'
 *     responses:
 *       200:
 *         description: Check-out recorded
 *       400:
 *         description: Already checked out
 *       404:
 *         description: Attendance record not found
 */
const checkOut = async (req, res, next) => {
  try {
    const record = await attendanceService.checkOut(req.params.id, req.body);
    res.json({ status: 'success', data: { record } });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/attendance:
 *   get:
 *     summary: List attendance records with filtering and pagination
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: employeeId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated list of attendance records
 */
const listAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.listAttendance(req.query);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/attendance/{id}:
 *   get:
 *     summary: Get a single attendance record
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
const getRecord = async (req, res, next) => {
  try {
    const record = await attendanceService.getRecordById(req.params.id);
    res.json({ status: 'success', data: { record } });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/attendance/employees/{employeeId}:
 *   get:
 *     summary: Get all attendance records for a specific employee
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Employee attendance records
 */
const getEmployeeAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.getEmployeeAttendance(
      req.params.employeeId,
      req.query
    );
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/attendance/summary:
 *   get:
 *     summary: Get attendance summary / report for a date range
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attendance summary report
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await attendanceService.getSummary(req.query);
    res.json({ status: 'success', data: { summary } });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkIn, checkOut, listAttendance, getRecord, getEmployeeAttendance, getSummary };
