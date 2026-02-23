'use strict';

const employeeService = require('../../services/employee.service');

/**
 * Employee CRUD controller.
 * All methods are thin — they delegate entirely to the service layer.
 */
class EmployeeController {
  async list(req, res, next) {
    try {
      const result = await employeeService.list(req.query);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const employee = await employeeService.getById(req.params.id);
      return res.status(200).json({ success: true, data: employee });
    } catch (err) {
      return next(err);
    }
  }

  async create(req, res, next) {
    try {
      const employee = await employeeService.create(req.body);
      return res.status(201).json({ success: true, data: employee });
    } catch (err) {
      return next(err);
    }
  }

  async update(req, res, next) {
    try {
      const employee = await employeeService.update(req.params.id, req.body);
      return res.status(200).json({ success: true, data: employee });
    } catch (err) {
      return next(err);
    }
  }

  async deactivate(req, res, next) {
    try {
      const result = await employeeService.deactivate(req.params.id);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new EmployeeController();
