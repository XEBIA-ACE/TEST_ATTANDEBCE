'use strict';

const employeeService = require('../../services/employeeService');
const { sendSuccess, buildPaginationMeta } = require('../../utils/response');

/**
 * HTTP handlers for /api/v1/employees.
 * Each method is a thin adapter: parse request → call service → format response.
 */
const employeeController = {
  /**
   * GET /employees
   * Returns a paginated list of employees.
   */
  async list(req, res, next) {
    try {
      const { employees, total, page, limit } = await employeeService.listEmployees(req.query);
      const meta = buildPaginationMeta(page, limit, total);
      return sendSuccess(res, employees, 'Employees retrieved successfully', 200, meta);
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /employees/:id
   */
  async getById(req, res, next) {
    try {
      const employee = await employeeService.getEmployee(req.params.id);
      return sendSuccess(res, employee, 'Employee retrieved successfully');
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /employees
   */
  async create(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      return sendSuccess(res, employee, 'Employee created successfully', 201);
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /employees/:id
   */
  async update(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      return sendSuccess(res, employee, 'Employee updated successfully');
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /employees/:id
   * Accepts ?force=true for hard delete; defaults to deactivation.
   */
  async remove(req, res, next) {
    try {
      const force = req.query.force === 'true';
      await employeeService.deleteEmployee(req.params.id, { force });
      return sendSuccess(res, null, force ? 'Employee deleted successfully' : 'Employee deactivated successfully');
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = employeeController;
