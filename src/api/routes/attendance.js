const express = require('express');
const router = express.Router();
const controller = require('../controllers/attendanceController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const v = require('../validators/attendanceValidator');

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance record management and check-in/check-out endpoints
 */

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: List attendance records (paginated, filterable)
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [present, absent, late, half_day, on_leave]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated attendance records
 */
router.get('/', authenticate, validate(v.listRecords), controller.list);

/**
 * @swagger
 * /attendance/{id}:
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
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/AttendanceRecord' }
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, validate(v.getRecord), controller.getById);

/**
 * @swagger
 * /attendance/check-in/{employeeId}:
 *   post:
 *     summary: Record employee check-in (auto-assigns today's date and derives status)
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Check-in recorded
 *       409:
 *         description: Already checked in today
 *       422:
 *         description: Employee inactive or validation error
 */
router.post('/check-in/:employeeId', authenticate, validate(v.checkIn), controller.checkIn);

/**
 * @swagger
 * /attendance/check-out/{employeeId}:
 *   post:
 *     summary: Record employee check-out
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Check-out recorded with total_hours computed
 *       422:
 *         description: No active check-in found
 */
router.post('/check-out/:employeeId', authenticate, validate(v.checkOut), controller.checkOut);

/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Manually create an attendance record (admin/backfill use)
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, date, check_in]
 *             properties:
 *               employee_id: { type: string, format: uuid }
 *               date: { type: string, format: date }
 *               check_in: { type: string, format: date-time }
 *               check_out: { type: string, format: date-time }
 *               status: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Record created
 */
router.post('/', authenticate, validate(v.createRecord), controller.create);

/**
 * @swagger
 * /attendance/{id}:
 *   patch:
 *     summary: Update an attendance record
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated record
 *       404:
 *         description: Not found
 */
router.patch('/:id', authenticate, validate(v.updateRecord), controller.update);

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
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', authenticate, validate(v.getRecord), controller.remove);

module.exports = router;
