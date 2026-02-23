const express = require('express');
const router = express.Router();
const Joi = require('joi');
const controller = require('../controllers/reportController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Attendance analytics and reporting
 */

/**
 * @swagger
 * /reports/employee/{employeeId}/summary:
 *   get:
 *     summary: Get attendance summary for a single employee over a date range
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Employee attendance summary
 *       404:
 *         description: Employee not found
 */
router.get(
  '/employee/:employeeId/summary',
  authenticate,
  validate({
    params: Joi.object({ employeeId: Joi.string().uuid().required() }),
    query: Joi.object({
      start_date: Joi.date().iso().required(),
      end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
    }),
  }),
  controller.employeeSummary
);

/**
 * @swagger
 * /reports/department/summary:
 *   get:
 *     summary: Get department-level attendance summary for a given date
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Defaults to today
 *     responses:
 *       200:
 *         description: Department breakdown with attendance rates
 */
router.get(
  '/department/summary',
  authenticate,
  validate({
    query: Joi.object({ date: Joi.date().iso().optional() }),
  }),
  controller.departmentSummary
);

module.exports = router;
