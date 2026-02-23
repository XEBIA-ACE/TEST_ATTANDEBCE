'use strict';

const employeeRepository = require('../repositories/employee.repository');
const logger = require('../config/logger');

/**
 * Business-logic layer for employees.
 * Orchestrates repository calls and enforces domain rules.
 */
class EmployeeService {
  /**
   * List employees with pagination and optional filters.
   */
  async list(options) {
    const { employees, total } = await employeeRepository.findAll(options);
    const { page = 1, limit = 20 } = options;
    return {
      employees: employees.map((e) => e.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single employee by ID.
   * Throws 404-style error if not found.
   */
  async getById(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      const err = new Error(`Employee with id '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }
    return employee.toJSON();
  }

  /**
   * Create a new employee.
   * Enforces uniqueness of employee_code and email at the service layer
   * (database constraints are the final guard).
   */
  async create(data) {
    // Check for duplicate employee_code
    const existingByCode = await employeeRepository.findByCode(data.employee_code);
    if (existingByCode) {
      const err = new Error(`Employee code '${data.employee_code}' is already in use`);
      err.statusCode = 409;
      throw err;
    }

    // Check for duplicate email
    const existingByEmail = await employeeRepository.findByEmail(data.email);
    if (existingByEmail) {
      const err = new Error(`Email '${data.email}' is already registered`);
      err.statusCode = 409;
      throw err;
    }

    const employee = await employeeRepository.create(data);
    logger.info('Employee created', { employeeId: employee.id, code: employee.employeeCode });
    return employee.toJSON();
  }

  /**
   * Update an existing employee.
   */
  async update(id, updates) {
    // Verify exists
    const existing = await employeeRepository.findById(id);
    if (!existing) {
      const err = new Error(`Employee with id '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }

    // Check email uniqueness if changing email
    if (updates.email && updates.email.toLowerCase() !== existing.email) {
      const duplicate = await employeeRepository.findByEmail(updates.email);
      if (duplicate && duplicate.id !== id) {
        const err = new Error(`Email '${updates.email}' is already registered`);
        err.statusCode = 409;
        throw err;
      }
    }

    const updated = await employeeRepository.update(id, updates);
    logger.info('Employee updated', { employeeId: id });
    return updated.toJSON();
  }

  /**
   * Soft-delete: deactivate an employee instead of hard-deleting.
   */
  async deactivate(id) {
    const success = await employeeRepository.deactivate(id);
    if (!success) {
      const err = new Error(`Employee with id '${id}' not found`);
      err.statusCode = 404;
      throw err;
    }
    logger.info('Employee deactivated', { employeeId: id });
    return { message: 'Employee deactivated successfully' };
  }
}

module.exports = new EmployeeService();
