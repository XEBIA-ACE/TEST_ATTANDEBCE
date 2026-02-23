const EmployeeService = require('../../services/employee.service');

const service = new EmployeeService();

/**
 * Employee controller — thin layer that translates HTTP requests
 * into service calls and formats responses.
 */

async function listEmployees(req, res, next) {
  try {
    const result = await service.listEmployees(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getEmployee(req, res, next) {
  try {
    const employee = await service.getEmployee(req.params.id);
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

async function createEmployee(req, res, next) {
  try {
    const employee = await service.createEmployee(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const employee = await service.updateEmployee(req.params.id, req.body);
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const result = await service.deleteEmployee(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
