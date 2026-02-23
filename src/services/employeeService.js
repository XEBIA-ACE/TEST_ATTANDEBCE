'use strict';

const bcrypt = require('bcryptjs');
const employeeRepository = require('../repositories/employeeRepository');
const config = require('../config');
const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Business logic for employee management.
 * Sits between the HTTP layer (controllers) and data layer (repositories).
 */
class EmployeeService {
  /**
   * Returns a paginated list of employees.
   *
   * @param {object} filters  - { page, limit, department, status, search }
   * @returns {Promise<{ employees: object[], total: number }>}
   */
  async listEmployees(filters = {}) {
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));

    const { rows, total } = await employeeRepository.findAll({
      ...filters,
      page,
      limit,
    });

    return { employees: rows, total, page, limit };
  }

  /**
   * Returns a single employee by their UUID.
   *
   * @throws {NotFoundError} if the employee does not exist
   */
  async getEmployee(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new NotFoundError('Employee');
    return employee;
  }

  /**
   * Creates a new employee.
   * Validates that the email and employee_code are unique before insert.
   *
   * @param {object} data  - Employee fields (validated at controller level)
   * @returns {Promise<object>} The created employee
   */
  async createEmployee(data) {
    // Uniqueness checks (do both lookups in parallel for efficiency)
    const [byEmail, byCode] = await Promise.all([
      employeeRepository.findByEmail(data.email),
      data.employee_code ? employeeRepository.findByCode(data.employee_code) : null,
    ]);

    if (byEmail) throw new ConflictError(`An employee with email '${data.email}' already exists`);
    if (byCode) throw new ConflictError(`Employee code '${data.employee_code}' is already in use`);

    // Hash the password only when provided during creation
    const payload = { ...data };
    if (payload.password) {
      payload.password_hash = await bcrypt.hash(payload.password, config.bcrypt.saltRounds);
      delete payload.password;
    }

    const employee = await employeeRepository.create(payload);
    logger.info('Employee created', { employeeId: employee.id, code: employee.employee_code });
    return employee;
  }

  /**
   * Updates an existing employee.
   * Email and employee_code uniqueness are re-validated when changed.
   */
  async updateEmployee(id, data) {
    const existing = await employeeRepository.findById(id);
    if (!existing) throw new NotFoundError('Employee');

    // Only check uniqueness constraints when those fields are being changed
    if (data.email && data.email !== existing.email) {
      const conflict = await employeeRepository.findByEmail(data.email);
      if (conflict) throw new ConflictError(`Email '${data.email}' is already in use`);
    }

    if (data.employee_code && data.employee_code !== existing.employee_code) {
      const conflict = await employeeRepository.findByCode(data.employee_code);
      if (conflict) throw new ConflictError(`Employee code '${data.employee_code}' is already in use`);
    }

    const payload = { ...data };
    if (payload.password) {
      payload.password_hash = await bcrypt.hash(payload.password, config.bcrypt.saltRounds);
      delete payload.password;
    }

    const updated = await employeeRepository.update(id, payload);
    logger.info('Employee updated', { employeeId: id });
    return updated;
  }

  /**
   * Soft-deletes by setting status to 'inactive', or hard-deletes if force=true.
   */
  async deleteEmployee(id, { force = false } = {}) {
    const existing = await employeeRepository.findById(id);
    if (!existing) throw new NotFoundError('Employee');

    if (force) {
      await employeeRepository.delete(id);
      logger.info('Employee hard-deleted', { employeeId: id });
    } else {
      await employeeRepository.update(id, { status: 'inactive' });
      logger.info('Employee deactivated', { employeeId: id });
    }
  }
}

module.exports = new EmployeeService();
