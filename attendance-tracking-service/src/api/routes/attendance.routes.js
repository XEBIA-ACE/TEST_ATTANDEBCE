const { Router } = require('express');
const controller = require('../controllers/attendance.controller');
const { validate } = require('../middleware/validation.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createAttendanceSchema,
  updateAttendanceSchema,
  attendanceQuerySchema,
  checkInSchema,
  checkOutSchema,
} = require('../../models/attendance.model');

const router = Router();

/**
 * @openapi
 * /attendance:
 *   get:
 *     summary: List attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-02-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-02-29"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [present, absent, late, half_day, on_leave, holiday]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated attendance records
 */
router.get(
  '/',
  authenticate,
  validate(attendanceQuerySchema, 'query'),
  controller.listRecords
);

/**
 * @openapi
 * /attendance/{id}:
 *   get:
 *     summary: Get a single attendance record
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
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
router.get('/:id', authenticate, controller.getRecord);

/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     summary: Record employee check-in
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
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
 *               notes:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Check-in recorded
 *       409:
 *         description: Already checked in today
 */
router.post('/check-in', authenticate, validate(checkInSchema), controller.checkIn);

/**
 * @openapi
 * /attendance/check-out:
 *   post:
 *     summary: Record employee check-out
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
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
 *               notes:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-out recorded with total hours
 *       404:
 *         description: No check-in found for today
 */
router.post('/check-out', authenticate, validate(checkOutSchema), controller.checkOut);

/**
 * @openapi
 * /attendance:
 *   post:
 *     summary: Manually create an attendance record (admin)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, date, status]
 *             properties:
 *               employee_id:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               check_in:
 *                 type: string
 *                 format: date-time
 *               check_out:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, half_day, on_leave, holiday]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validate(createAttendanceSchema),
  controller.createRecord
);

/**
 * @openapi
 * /attendance/{id}:
 *   patch:
 *     summary: Update an attendance record (admin)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record updated
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  validate(updateAttendanceSchema),
  controller.updateRecord
);

/**
 * @openapi
 * /attendance/{id}:
 *   delete:
 *     summary: Delete an attendance record (admin)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record deleted
 */
router.delete('/:id', authenticate, authorize('admin'), controller.deleteRecord);

/**
 * @openapi
 * /attendance/summary/{employee_id}:
 *   get:
 *     summary: Get attendance summary for an employee
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date_from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Attendance summary with counts per status
 */
router.get('/summary/:employee_id', authenticate, controller.getSummary);

module.exports = router;
