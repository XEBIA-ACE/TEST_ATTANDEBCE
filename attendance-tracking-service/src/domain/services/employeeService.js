'use strict';

const EmployeeRepository = require('../../infrastructure/repositories/employeeRepository');
const Employee = require('../models/Employee');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

/**
 * Business logic layer for Employee operations.
 * Coordinates between API layer and data access layer.
 */
class EmployeeService {
  constructor(employeeRepository = null) {
    this.employeeRepo = employeeRepository || new EmployeeRepository();
  }

  /**
   * Lists employees with pagination and filtering.
   */
  async listEmployees(filters = {}) {
    const { page = 1, limit = 20 } = filters;

    // Clamp pagination values
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    return this.employeeRepo.findAll({ ...filters, page: safePage, limit: safeLimit });
  }

  /**
   * Retrieves a single employee by ID.
   */
  async getEmployee(id) {
    return this.employeeRepo.findById(id);
  }

  /**
   * Creates a new employee after validating uniqueness constraints.
   */
  async createEmployee(data) {
    // Check for duplicate employee number
    if (await this.employeeRepo.isEmployeeNumberTaken(data.employee_number)) {
      throw AppError.conflict(
        `Employee number '${data.employee_number}' is already in use`
      );
    }

    // Check for duplicate email
    if (await this.employeeRepo.isEmailTaken(data.email)) {
      throw AppError.conflict(`Email '${data.email}' is already registered`);
    }

    const employee = await this.employeeRepo.create(data);
    logger.info('Employee created', { employee_id: employee.id, employee_number: employee.employee_number });
    return employee;
  }

  /**
   * Updates an employee's details.
   */
  async updateEmployee(id, data) {
    // Ensure target employee exists before checking uniqueness
    await this.employeeRepo.findById(id);

    if (data.employee_number) {
      if (await this.employeeRepo.isEmployeeNumberTaken(data.employee_number, id)) {
        throw AppError.conflict(
          `Employee number '${data.employee_number}' is already in use`
        );
      }
    }

    if (data.email) {
      if (await this.employeeRepo.isEmailTaken(data.email, id)) {
        throw AppError.conflict(`Email '${data.email}' is already registered`);
      }
    }

    const updated = await this.employeeRepo.update(id, data);
    logger.info('Employee updated', { employee_id: id });
    return updated;
  }

  /**
   * Soft-deletes an employee.
   */
  async deleteEmployee(id) {
    await this.employeeRepo.delete(id);
    logger.info('Employee deleted', { employee_id: id });
    return { message: 'Employee successfully deleted' };
  }

  /**
   * Returns a list of unique departments.
   */
  async getDepartments() {
    const result = await this.employeeRepo.findAll({ limit: 1000 });
    const departments = [...new Set(result.data.map((e) => e.department).filter(Boolean))];
    return departments.sort();
  }
}

module.exports = EmployeeService;
