'use strict';

const { Router } = require('express');
const employeeController = require('../controllers/employee.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
} = require('../validators/employee.validator');

const router = Router();

// Apply authentication to all employee routes
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Employees
 *   description: Employee management endpoints
 *
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id:                 { type: string, format: uuid }
 *         employeeCode:       { type: string, example: EMP-001 }
 *         firstName:          { type: string, example: Alice }
 *         lastName:           { type: string, example: Johnson }
 *         email:              { type: string, format: email }
 *         department:         { type: string, example: Engineering }
 *         jobTitle:           { type: string, example: Software Engineer }
 *         expectedHoursPerDay: { type: number, example: 8 }
 *         isActive:           { type: boolean, example: true }
 *         hireDate:           { type: string, format: date }
 *         created_at:         { type: string, format: date-time }
 *         updated_at:         { type: string, format: date-time }
 *
 *     CreateEmployeeRequest:
 *       type: object
 *       required: [employeeCode, firstName, lastName, email]
 *       properties:
 *         employeeCode:       { type: string, example: EMP-001 }
 *         firstName:          { type: string, example: Alice }
 *         lastName:           { type: string, example: Johnson }
 *         email:              { type: string, format: email }
 *         department:         { type: string, example: Engineering }
 *         jobTitle:           { type: string, example: Software Engineer }
 *         expectedHoursPerDay: { type: number, example: 8 }
 *         hireDate:           { type: string, format: date }
 *         password:           { type: string, format: password, minLength: 8 }
 *         isActive:           { type: boolean, default: true }
 */

/**
 * @openapi
 * /employees:
 *   get:
 *     tags: [Employees]
 *     summary: List employees (paginated)
 *     parameters:
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, email, or employee code
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of employees
 *
 *   post:
 *     tags: [Employees]
 *     summary: Create a new employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeRequest'
 *     responses:
 *       201:
 *         description: Employee created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Employee code or email already in use
 */
router
  .route('/')
  .get(validate(listEmployeesSchema, 'query'), employeeController.list)
  .post(validate(createEmployeeSchema), employeeController.create);

/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get a single employee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 *
 *   patch:
 *     tags: [Employees]
 *     summary: Update an employee
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
 *             type: object
 *             description: Any subset of employee fields to update
 *     responses:
 *       200:
 *         description: Employee updated
 *       404:
 *         description: Employee not found
 *
 *   delete:
 *     tags: [Employees]
 *     summary: Soft-delete an employee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Employee deleted
 *       404:
 *         description: Employee not found
 */
router
  .route('/:id')
  .get(employeeController.getOne)
  .patch(validate(updateEmployeeSchema), employeeController.update)
  .delete(employeeController.remove);

module.exports = router;
