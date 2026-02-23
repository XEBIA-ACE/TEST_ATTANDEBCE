const express = require('express');
const router = express.Router();
const controller = require('../controllers/employeeController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const v = require('../validators/employeeValidator');

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management endpoints
 */

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List all employees (paginated)
 *     tags: [Employees]
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
 *         name: status
 *         schema: { type: string, enum: [active, inactive, on_leave] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated employee list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Employee' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get('/', authenticate, validate(v.listEmployees), controller.list);

/**
 * @swagger
 * /employees/departments:
 *   get:
 *     summary: Get distinct department list
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Array of department names
 */
router.get('/departments', authenticate, controller.getDepartments);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get a single employee by ID
 *     tags: [Employees]
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
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Employee' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id', authenticate, validate(v.getEmployee), controller.getById);

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
 *             type: object
 *             required: [first_name, last_name, email]
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string, format: email }
 *               department: { type: string }
 *               position: { type: string }
 *               hire_date: { type: string, format: date }
 *               status: { type: string, enum: [active, inactive, on_leave] }
 *     responses:
 *       201:
 *         description: Employee created
 *       409:
 *         description: Conflict (duplicate email or code)
 *       422:
 *         description: Validation error
 */
router.post('/', authenticate, validate(v.createEmployee), controller.create);

/**
 * @swagger
 * /employees/{id}:
 *   patch:
 *     summary: Partially update an employee
 *     tags: [Employees]
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
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string }
 *               department: { type: string }
 *               position: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Updated employee
 *       404:
 *         description: Not found
 */
router.patch('/:id', authenticate, validate(v.updateEmployee), controller.update);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Soft-delete an employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 */
router.delete('/:id', authenticate, validate(v.getEmployee), controller.remove);

module.exports = router;
