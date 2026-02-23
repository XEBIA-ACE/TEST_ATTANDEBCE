'use strict';

const bcrypt = require('bcryptjs');
const employeeRepository = require('../../data/repositories/employee.repository');
const AppError = require('../../utils/app.error');

/**
 * EmployeeService contains all business logic for employee management.
 * It depends only on the repository abstraction (no Sequelize imports here).
 */
class EmployeeService {
  /**
   * Retrieve a paginated list of employees.
   */
  async listEmployees(filters, page, limit) {
    const { count, rows } = await employeeRepository.findAll(filters, page, limit);
    return { employees: rows, total: count };
  }

  /**
   * Get a single employee by UUID. Throws 404 if not found.
   */
  async getEmployee(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw AppError.notFound('Employee');
    return employee;
  }

  /**
   * Create a new employee.
   * - Validates uniqueness of employeeCode and email.
   * - Hashes the provided password before storage.
   */
  async createEmployee(data) {
    const { employeeCode, email, password, ...rest } = data;

    if (await employeeRepository.existsBy('employeeCode', employeeCode)) {
      throw AppError.conflict(`Employee code "${employeeCode}" is already in use`);
    }
    if (await employeeRepository.existsBy('email', email)) {
      throw AppError.conflict(`Email "${email}" is already registered`);
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    return employeeRepository.create({ employeeCode, email, ...rest, passwordHash });
  }

  /**
   * Update an existing employee.
   * - Validates uniqueness of employeeCode and email (excluding the current record).
   * - Only updates fields that are explicitly provided.
   */
  async updateEmployee(id, data) {
    const { employeeCode, email, password, ...rest } = data;

    // Ensure the employee actually exists before uniqueness checks
    await this.getEmployee(id);

    if (employeeCode && (await employeeRepository.existsBy('employeeCode', employeeCode, id))) {
      throw AppError.conflict(`Employee code "${employeeCode}" is already in use`);
    }
    if (email && (await employeeRepository.existsBy('email', email, id))) {
      throw AppError.conflict(`Email "${email}" is already registered`);
    }

    const updateData = { ...rest };
    if (employeeCode) updateData.employeeCode = employeeCode;
    if (email) updateData.email = email;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

    return employeeRepository.update(id, updateData);
  }

  /**
   * Soft-delete an employee. Throws 404 if not found.
   */
  async deleteEmployee(id) {
    await this.getEmployee(id);
    return employeeRepository.delete(id);
  }
}

module.exports = new EmployeeService();
