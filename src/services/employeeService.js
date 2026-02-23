'use strict';

const employeeRepository = require('../repositories/employeeRepository');
const { NotFoundError, ConflictError } = require('../utils/errors');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Business logic layer for employees.
 * Orchestrates validation, authorization checks, and data access.
 */
const employeeService = {
  async listEmployees({ status, department, search, page, limit } = {}) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(
      parseInt(limit, 10) || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );

    const { data, total } = await employeeRepository.findAll({
      status,
      department,
      search,
      page: safePage,
      limit: safeLimit,
    });

    return { data, total, page: safePage, limit: safeLimit };
  },

  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new NotFoundError('Employee', id);
    return employee;
  },

  async createEmployee(employeeData) {
    // Enforce unique email and employee_code
    const [existingEmail, existingCode] = await Promise.all([
      employeeRepository.findByEmail(employeeData.email),
      employeeRepository.findByEmployeeCode(employeeData.employee_code),
    ]);

    if (existingEmail) {
      throw new ConflictError(`An employee with email '${employeeData.email}' already exists`);
    }
    if (existingCode) {
      throw new ConflictError(
        `An employee with code '${employeeData.employee_code}' already exists`
      );
    }

    const employee = await employeeRepository.create(employeeData);
    logger.info('Employee created', { employeeId: employee.id, code: employee.employee_code });
    return employee;
  },

  async updateEmployee(id, updateData) {
    // Verify employee exists
    const existing = await employeeRepository.findById(id);
    if (!existing) throw new NotFoundError('Employee', id);

    // Prevent duplicate email on another employee
    if (updateData.email && updateData.email !== existing.email) {
      const conflict = await employeeRepository.findByEmail(updateData.email);
      if (conflict) {
        throw new ConflictError(`Email '${updateData.email}' is already in use`);
      }
    }

    // Prevent duplicate code on another employee
    if (updateData.employee_code && updateData.employee_code !== existing.employee_code) {
      const conflict = await employeeRepository.findByEmployeeCode(updateData.employee_code);
      if (conflict) {
        throw new ConflictError(`Employee code '${updateData.employee_code}' is already in use`);
      }
    }

    const employee = await employeeRepository.update(id, updateData);
    logger.info('Employee updated', { employeeId: id });
    return employee;
  },

  async deleteEmployee(id) {
    const existing = await employeeRepository.findById(id);
    if (!existing) throw new NotFoundError('Employee', id);

    await employeeRepository.delete(id);
    logger.info('Employee deleted', { employeeId: id });
  },

  async getDepartments() {
    return employeeRepository.getDepartments();
  },
};

module.exports = employeeService;
