'use strict';

const { Router } = require('express');
const employeeController = require('../controllers/employeeController');
const validate = require('../middlewares/validate');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
} = require('../validators/employeeValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management
 */

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List all employees
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, on_leave] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of employees
 */
router.get('/', validate(listEmployeesSchema, 'query'), employeeController.list);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Employee object
 *       404:
 *         description: Employee not found
 */
router.get('/:id', employeeController.getById);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Employee created
 *       409:
 *         description: Duplicate email or employee code
 */
router.post('/', validate(createEmployeeSchema), employeeController.create);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update an employee
 *     tags: [Employees]
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
 *         description: Employee updated
 *       404:
 *         description: Employee not found
 */
router.put('/:id', validate(updateEmployeeSchema), employeeController.update);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Deactivate (or delete) an employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: force
 *         schema: { type: boolean }
 *         description: Set to true to permanently delete
 *     responses:
 *       200:
 *         description: Employee deactivated/deleted
 *       404:
 *         description: Employee not found
 */
router.delete('/:id', employeeController.remove);

module.exports = router;
