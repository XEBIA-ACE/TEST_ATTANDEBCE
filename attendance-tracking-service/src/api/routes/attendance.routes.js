'use strict';

const { Router } = require('express');
const controller = require('../controllers/attendance.controller');
const { validate } = require('../middleware/validation.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  checkInSchema,
  checkOutSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceSchema,
  reportQuerySchema,
} = require('../../validators/attendance.validator');

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Attendance
 *     description: Attendance record management
 */

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: List attendance records
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
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
 *         schema: { type: string, enum: [present, absent, late, half_day, holiday, leave] }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated attendance records
 */
router.get(
  '/',
  authenticate,
  validate(listAttendanceSchema, 'query'),
  controller.list.bind(controller)
);

/**
 * @swagger
 * /attendance/report:
 *   get:
 *     summary: Get an attendance summary report
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: employee_id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Summary report per employee
 */
router.get(
  '/report',
  authenticate,
  validate(reportQuerySchema, 'query'),
  controller.getSummaryReport.bind(controller)
);

/**
 * @swagger
 * /attendance/{id}:
 *   get:
 *     summary: Get a single attendance record
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
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
 */
router.get('/:id', authenticate, controller.getById.bind(controller));

/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     summary: Record a check-in for an employee
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id]
 *             properties:
 *               employee_id:    { type: string, format: uuid }
 *               check_in_time:  { type: string, format: date-time }
 *               notes:          { type: string }
 *     responses:
 *       201:
 *         description: Attendance record created
 *       409:
 *         description: Already checked in today
 */
router.post(
  '/check-in',
  authenticate,
  validate(checkInSchema),
  controller.checkIn.bind(controller)
);

/**
 * @swagger
 * /attendance/{id}/check-out:
 *   patch:
 *     summary: Record a check-out for an existing attendance record
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               check_out_time: { type: string, format: date-time }
 *               notes:          { type: string }
 *     responses:
 *       200:
 *         description: Updated with check-out time
 */
router.patch(
  '/:id/check-out',
  authenticate,
  validate(checkOutSchema),
  controller.checkOut.bind(controller)
);

/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Manually create an attendance record (admin)
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'hr'),
  validate(createAttendanceSchema),
  controller.create.bind(controller)
);

/**
 * @swagger
 * /attendance/{id}:
 *   patch:
 *     summary: Update an attendance record (admin)
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'hr'),
  validate(updateAttendanceSchema),
  controller.update.bind(controller)
);

/**
 * @swagger
 * /attendance/{id}:
 *   delete:
 *     summary: Delete an attendance record (admin)
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  controller.delete.bind(controller)
);

module.exports = router;
