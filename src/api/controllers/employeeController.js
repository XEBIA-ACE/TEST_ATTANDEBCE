'use strict';

const employeeService = require('../../services/employeeService');
const { success, created, paginated, noContent } = require('../../utils/response');

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management endpoints
 */

const employeeController = {
  /**
   * @swagger
   * /employees:
   *   get:
   *     summary: List all employees
   *     tags: [Employees]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive, on_leave]
   *       - in: query
   *         name: department
   *         schema:
   *           type: string
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name, email, or employee code
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Paginated list of employees
   */
  async list(req, res, next) {
    try {
      const { status, department, search, page, limit } = req.query;
      const result = await employeeService.listEmployees({ status, department, search, page, limit });
      return paginated(res, result.data, result.page, result.limit, result.total);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /employees/{id}:
   *   get:
   *     summary: Get an employee by ID
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Employee details
   *       404:
   *         description: Employee not found
   */
  async getById(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      return success(res, employee);
    } catch (err) {
      next(err);
    }
  },

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
   *             required: [employee_code, first_name, last_name, email]
   *             properties:
   *               employee_code:
   *                 type: string
   *                 example: EMP004
   *               first_name:
   *                 type: string
   *               last_name:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               department:
   *                 type: string
   *               position:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [active, inactive, on_leave]
   *               hire_date:
   *                 type: string
   *                 format: date
   *               expected_check_in:
   *                 type: string
   *                 example: "09:00:00"
   *               expected_check_out:
   *                 type: string
   *                 example: "18:00:00"
   *     responses:
   *       201:
   *         description: Employee created
   *       409:
   *         description: Duplicate email or employee code
   */
  async create(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      return created(res, employee);
    } catch (err) {
      next(err);
    }
  },

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
   *         schema:
   *           type: string
   *           format: uuid
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
  async update(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      return success(res, employee);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /employees/{id}:
   *   delete:
   *     summary: Delete an employee
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       204:
   *         description: Employee deleted
   *       404:
   *         description: Employee not found
   */
  async remove(req, res, next) {
    try {
      await employeeService.deleteEmployee(req.params.id);
      return noContent(res);
    } catch (err) {
      next(err);
    }
  },

  async getDepartments(req, res, next) {
    try {
      const departments = await employeeService.getDepartments();
      return success(res, departments);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = employeeController;
