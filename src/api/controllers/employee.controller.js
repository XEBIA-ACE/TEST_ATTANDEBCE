const employeeService = require('../../services/employee.service');
const { sendSuccess, sendCreated, sendNoContent, paginationMeta } = require('../../utils/response');

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management endpoints
 */
class EmployeeController {
  /**
   * @swagger
   * /api/v1/employees:
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
   *         name: search
   *         schema: { type: string }
   *       - in: query
   *         name: departmentId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   *     responses:
   *       200:
   *         description: Paginated list of employees
   */
  async list(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const { count, employees } = await employeeService.listEmployees({ page, limit, ...filters });
      return sendSuccess(res, employees, {
        meta: paginationMeta({ count, page, limit }),
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/employees/{id}:
   *   get:
   *     summary: Get an employee by ID
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
  async get(req, res, next) {
    try {
      const employee = await employeeService.getEmployee(req.params.id);
      return sendSuccess(res, employee);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/employees:
   *   post:
   *     summary: Create a new employee
   *     tags: [Employees]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateEmployee'
   *     responses:
   *       201:
   *         description: Employee created
   *       409:
   *         description: Email already in use
   */
  async create(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      return sendCreated(res, employee, 'Employee created successfully');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/employees/{id}:
   *   patch:
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
   *             $ref: '#/components/schemas/UpdateEmployee'
   *     responses:
   *       200:
   *         description: Employee updated
   *       404:
   *         description: Employee not found
   */
  async update(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      return sendSuccess(res, employee, { message: 'Employee updated successfully' });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /api/v1/employees/{id}:
   *   delete:
   *     summary: Soft-delete an employee
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       204:
   *         description: Employee deleted
   *       404:
   *         description: Employee not found
   */
  async delete(req, res, next) {
    try {
      await employeeService.deleteEmployee(req.params.id);
      return sendNoContent(res);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new EmployeeController();
