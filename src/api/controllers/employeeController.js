const employeeService = require('../../domain/services/employeeService');

/**
 * HTTP controller for Employee endpoints.
 * Delegates all business logic to the service layer.
 * Returns consistent { success, data, pagination } response shapes.
 */
class EmployeeController {
  async list(req, res, next) {
    try {
      const result = await employeeService.getAllEmployees(req.query);
      return res.json({
        success: true,
        data: result.data.map((e) => e.toJSON()),
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      return res.json({ success: true, data: employee.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      return res.status(201).json({ success: true, data: employee.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      return res.json({ success: true, data: employee.toJSON() });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await employeeService.deleteEmployee(req.params.id);
      return res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getDepartments(req, res, next) {
    try {
      const departments = await employeeService.getDepartments();
      return res.json({ success: true, data: departments });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmployeeController();
