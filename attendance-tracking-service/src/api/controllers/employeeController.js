'use strict';

const EmployeeService = require('../../domain/services/employeeService');

/**
 * HTTP controller for Employee endpoints.
 * Delegates all business logic to EmployeeService.
 * Only responsible for request parsing and response formatting.
 */
class EmployeeController {
  constructor(employeeService = null) {
    this.service = employeeService || new EmployeeService();

    // Bind methods to preserve 'this' context when used as route handlers
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.getDepartments = this.getDepartments.bind(this);
  }

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
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [active, inactive, on_leave] }
   *       - in: query
   *         name: department
   *         schema: { type: string }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Paginated list of employees
   */
  async list(req, res, next) {
    try {
      const result = await this.service.listEmployees(req.query);
      res.json({
        success: true,
        data: result.data.map((e) => e.toJSON()),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

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
   *         description: Employee details
   *       404:
   *         description: Employee not found
   */
  async getById(req, res, next) {
    try {
      const employee = await this.service.getEmployee(req.params.id);
      res.json({ success: true, data: employee.toJSON() });
    } catch (err) {
      next(err);
    }
  }

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
   *         description: Duplicate employee number or email
   */
  async create(req, res, next) {
    try {
      const employee = await this.service.createEmployee(req.body);
      res.status(201).json({ success: true, data: employee.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /employees/{id}:
   *   patch:
   *     summary: Update employee details
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Updated employee
   *       404:
   *         description: Employee not found
   */
  async update(req, res, next) {
    try {
      const employee = await this.service.updateEmployee(req.params.id, req.body);
      res.json({ success: true, data: employee.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /employees/{id}:
   *   delete:
   *     summary: Delete an employee (soft delete)
   *     tags: [Employees]
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
  async remove(req, res, next) {
    try {
      const result = await this.service.deleteEmployee(req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /employees/departments:
   *   get:
   *     summary: List all unique departments
   *     tags: [Employees]
   *     responses:
   *       200:
   *         description: List of departments
   */
  async getDepartments(req, res, next) {
    try {
      const departments = await this.service.getDepartments();
      res.json({ success: true, data: departments });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EmployeeController;
