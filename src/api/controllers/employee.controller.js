'use strict';

const employeeService = require('../../business/services/employee.service');
const ResponseHelper = require('../../utils/response.helper');

/**
 * EmployeeController maps HTTP requests to EmployeeService calls.
 * No business logic lives here – only HTTP translation.
 */
class EmployeeController {
  async list(req, res, next) {
    try {
      const { page, limit, ...filters } = req.query;
      const { employees, total } = await employeeService.listEmployees(filters, page, limit);

      return ResponseHelper.success(res, {
        message: 'Employees retrieved successfully',
        data: employees,
        meta: ResponseHelper.paginationMeta(total, page, limit),
      });
    } catch (err) {
      return next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const employee = await employeeService.getEmployee(req.params.id);
      return ResponseHelper.success(res, {
        message: 'Employee retrieved successfully',
        data: employee,
      });
    } catch (err) {
      return next(err);
    }
  }

  async create(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      const { passwordHash, ...safeEmployee } = employee.toJSON();
      return ResponseHelper.created(res, {
        message: 'Employee created successfully',
        data: safeEmployee,
      });
    } catch (err) {
      return next(err);
    }
  }

  async update(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      const { passwordHash, ...safeEmployee } = employee.toJSON();
      return ResponseHelper.success(res, {
        message: 'Employee updated successfully',
        data: safeEmployee,
      });
    } catch (err) {
      return next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await employeeService.deleteEmployee(req.params.id);
      return ResponseHelper.success(res, { message: 'Employee deleted successfully' });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new EmployeeController();
