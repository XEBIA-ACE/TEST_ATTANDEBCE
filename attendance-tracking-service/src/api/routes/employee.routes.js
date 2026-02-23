'use strict';

const { Router } = require('express');
const controller = require('../controllers/employee.controller');
const { validate } = require('../middleware/validation.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
} = require('../../validators/employee.validator');

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Employees
 *     description: Employee management
 */

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List all employees
 *     tags: [Employees]
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
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of employees
 */
router.get(
  '/',
  authenticate,
  validate(listEmployeesSchema, 'query'),
  controller.list.bind(controller)
);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get an employee by ID
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Employee object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 */
router.get('/:id', authenticate, controller.getById.bind(controller));

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_code, first_name, last_name, email]
 *             properties:
 *               employee_code: { type: string, example: EMP-001 }
 *               first_name:    { type: string }
 *               last_name:     { type: string }
 *               email:         { type: string, format: email }
 *               department:    { type: string }
 *               position:      { type: string }
 *               hire_date:     { type: string, format: date }
 *     responses:
 *       201:
 *         description: Created employee
 *       409:
 *         description: Duplicate employee code or email
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'hr'),
  validate(createEmployeeSchema),
  controller.create.bind(controller)
);

/**
 * @swagger
 * /employees/{id}:
 *   patch:
 *     summary: Update an employee
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       200:
 *         description: Updated employee
 *       404:
 *         description: Employee not found
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'hr'),
  validate(updateEmployeeSchema),
  controller.update.bind(controller)
);

/**
 * @swagger
 * /employees/{id}/deactivate:
 *   delete:
 *     summary: Deactivate (soft-delete) an employee
 *     tags: [Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Employee deactivated
 *       404:
 *         description: Employee not found
 */
router.delete(
  '/:id/deactivate',
  authenticate,
  authorize('admin'),
  controller.deactivate.bind(controller)
);

module.exports = router;
