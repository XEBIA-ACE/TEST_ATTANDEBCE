const { v4: uuidv4 } = require('uuid');
const employeeRepository = require('../../infrastructure/repositories/employeeRepository');
const logger = require('../../config/logger');

/**
 * Business logic layer for Employee management.
 * Orchestrates validation, uniqueness checks, and persistence.
 */
class EmployeeService {
  async getAllEmployees(filters) {
    return employeeRepository.findAll(filters);
  }

  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }
    return employee;
  }

  async createEmployee(data) {
    // Enforce uniqueness of email and employee code across the organisation
    const [existingEmail, existingCode] = await Promise.all([
      employeeRepository.findByEmail(data.email),
      data.employee_code ? employeeRepository.findByEmployeeCode(data.employee_code) : null,
    ]);

    if (existingEmail) {
      const err = new Error('An employee with this email already exists');
      err.statusCode = 409;
      throw err;
    }
    if (existingCode) {
      const err = new Error('An employee with this employee code already exists');
      err.statusCode = 409;
      throw err;
    }

    const employeeCode = data.employee_code || (await this._generateEmployeeCode());
    const payload = {
      id: uuidv4(),
      ...data,
      employee_code: employeeCode,
      status: data.status || 'active',
    };

    const employee = await employeeRepository.create(payload);
    logger.info('Employee created', { employeeId: employee.id, code: employee.employeeCode });
    return employee;
  }

  async updateEmployee(id, data) {
    // Prevent duplicate email when updating
    if (data.email) {
      const existing = await employeeRepository.findByEmail(data.email);
      if (existing && existing.id !== id) {
        const err = new Error('An employee with this email already exists');
        err.statusCode = 409;
        throw err;
      }
    }

    const employee = await employeeRepository.update(id, data);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    logger.info('Employee updated', { employeeId: id });
    return employee;
  }

  async deleteEmployee(id) {
    const deleted = await employeeRepository.delete(id);
    if (!deleted) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }
    logger.info('Employee soft-deleted', { employeeId: id });
  }

  async getDepartments() {
    return employeeRepository.getDepartments();
  }

  /**
   * Generates a sequential employee code (e.g. EMP-0042).
   * Falls back to a short UUID suffix if the query fails.
   */
  async _generateEmployeeCode() {
    try {
      const { data } = await employeeRepository.findAll({ limit: 1 });
      const count = data.length;
      return `EMP-${String(count + 1).padStart(4, '0')}`;
    } catch {
      return `EMP-${uuidv4().slice(0, 6).toUpperCase()}`;
    }
  }
}

module.exports = new EmployeeService();
