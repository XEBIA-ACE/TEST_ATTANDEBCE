'use strict';

const { Router } = require('express');
const attendanceController = require('../controllers/attendanceController');
const validate = require('../middlewares/validate');
const {
  checkInSchema,
  checkOutSchema,
  upsertAttendanceSchema,
  listAttendanceSchema,
  reportQuerySchema,
} = require('../validators/attendanceValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance check-in / check-out and records
 */

/**
 * @swagger
 * /attendance:
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
 *         name: employee_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [present, absent, late, half_day, on_leave] }
 *     responses:
 *       200:
 *         description: Paginated attendance records
 */
router.get('/', validate(listAttendanceSchema, 'query'), attendanceController.list);

/**
 * @swagger
 * /attendance/report:
 *   get:
 *     summary: Get aggregated attendance report
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: employee_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attendance summary per employee
 */
router.get('/report', validate(reportQuerySchema, 'query'), attendanceController.report);

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
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Attendance record
 *       404:
 *         description: Record not found
 */
router.get('/:id', attendanceController.getById);

/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     summary: Record an employee check-in
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id]
 *             properties:
 *               employee_id:
 *                 type: string
 *                 format: uuid
 *               check_in_time:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Check-in recorded
 *       409:
 *         description: Already checked in today
 */
router.post('/check-in', validate(checkInSchema), attendanceController.checkIn);

/**
 * @swagger
 * /attendance/check-out:
 *   post:
 *     summary: Record an employee check-out
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id]
 *             properties:
 *               employee_id:
 *                 type: string
 *                 format: uuid
 *               check_out_time:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-out recorded
 *       400:
 *         description: No check-in found for today
 */
router.post('/check-out', validate(checkOutSchema), attendanceController.checkOut);

/**
 * @swagger
 * /attendance/employees/{employeeId}/{date}:
 *   put:
 *     summary: Manually upsert an attendance record (admin)
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: '2024-01-15' }
 *     responses:
 *       200:
 *         description: Record upserted
 */
router.put(
  '/employees/:employeeId/:date',
  validate(upsertAttendanceSchema),
  attendanceController.upsert
);

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
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record deleted
 *       404:
 *         description: Record not found
 */
router.delete('/:id', attendanceController.remove);

module.exports = router;
