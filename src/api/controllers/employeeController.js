const employeeService = require('../../business/services/employeeService');

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management endpoints
 */

/**
 * @swagger
 * /v1/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeRequest'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       409:
 *         description: Email already registered
 *       422:
 *         description: Validation error
 */
const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({ status: 'success', data: { employee } });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/employees:
 *   get:
 *     summary: List employees with pagination and filtering
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of employees
 */
const listEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.listEmployees(req.query);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/employees/{id}:
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
 *         description: Employee details
 *       404:
 *         description: Employee not found
 */
const getEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json({ status: 'success', data: { employee } });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/employees/{id}:
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
 *             $ref: '#/components/schemas/UpdateEmployeeRequest'
 *     responses:
 *       200:
 *         description: Employee updated
 *       404:
 *         description: Employee not found
 */
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    res.json({ status: 'success', data: { employee } });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/employees/{id}:
 *   delete:
 *     summary: Soft-delete (deactivate) an employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Employee deactivated
 *       404:
 *         description: Employee not found
 */
const deleteEmployee = async (req, res, next) => {
  try {
    await employeeService.deactivateEmployee(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { createEmployee, listEmployees, getEmployee, updateEmployee, deleteEmployee };
