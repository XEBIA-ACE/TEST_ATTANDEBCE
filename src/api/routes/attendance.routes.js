'use strict';

const { Router } = require('express');
const attendanceController = require('../controllers/attendance.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  checkInSchema,
  checkOutSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceSchema,
  reportSchema,
} = require('../validators/attendance.validator');

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Attendance
 *   description: Attendance tracking – check-in/out and record management
 *
 * components:
 *   schemas:
 *     AttendanceRecord:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid }
 *         employeeId:  { type: string, format: uuid }
 *         date:        { type: string, format: date }
 *         checkIn:     { type: string, format: date-time }
 *         checkOut:    { type: string, format: date-time, nullable: true }
 *         workedHoursStored: { type: number, example: 8.5, nullable: true }
 *         status:
 *           type: string
 *           enum: [present, absent, late, half_day, on_leave]
 *         notes:       { type: string, nullable: true }
 *         checkInIp:   { type: string, nullable: true }
 *         checkOutIp:  { type: string, nullable: true }
 *         created_at:  { type: string, format: date-time }
 *         updated_at:  { type: string, format: date-time }
 */

/**
 * @openapi
 * /attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: List attendance records (paginated)
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [present, absent, late, half_day, on_leave] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of attendance records
 *
 *   post:
 *     tags: [Attendance]
 *     summary: Manually create an attendance record (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, date]
 *             properties:
 *               employeeId: { type: string, format: uuid }
 *               date:       { type: string, format: date }
 *               checkIn:    { type: string, format: date-time }
 *               checkOut:   { type: string, format: date-time }
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, half_day, on_leave]
 *               notes:      { type: string }
 *     responses:
 *       201:
 *         description: Attendance record created
 */
router
  .route('/')
  .get(validate(listAttendanceSchema, 'query'), attendanceController.list)
  .post(validate(createAttendanceSchema), attendanceController.create);

/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     tags: [Attendance]
 *     summary: Employee check-in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId]
 *             properties:
 *               employeeId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Check-in recorded
 *       409:
 *         description: Already checked in today
 */
router.post('/check-in', validate(checkInSchema), attendanceController.checkIn);

/**
 * @openapi
 * /attendance/check-out:
 *   post:
 *     tags: [Attendance]
 *     summary: Employee check-out
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId]
 *             properties:
 *               employeeId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Check-out recorded
 *       400:
 *         description: No check-in found for today
 */
router.post('/check-out', validate(checkOutSchema), attendanceController.checkOut);

/**
 * @openapi
 * /attendance/report:
 *   get:
 *     tags: [Attendance]
 *     summary: Get an attendance summary report for a date range
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
 *         name: employeeId
 *         schema: { type: string, format: uuid }
 *         description: Omit to get a company-wide summary
 *     responses:
 *       200:
 *         description: Attendance summary with totals
 */
router.get('/report', validate(reportSchema, 'query'), attendanceController.getReport);

/**
 * @openapi
 * /attendance/{id}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get a single attendance record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Attendance record
 *       404:
 *         description: Not found
 *
 *   patch:
 *     tags: [Attendance]
 *     summary: Update an attendance record (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record updated
 *
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete an attendance record (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record deleted
 */
router
  .route('/:id')
  .get(attendanceController.getOne)
  .patch(validate(updateAttendanceSchema), attendanceController.update)
  .delete(attendanceController.remove);

module.exports = router;
