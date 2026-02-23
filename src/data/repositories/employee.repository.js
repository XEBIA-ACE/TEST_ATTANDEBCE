'use strict';

const { Op } = require('sequelize');
const Employee = require('../models/employee.model');

/**
 * EmployeeRepository encapsulates all database access for the Employee model.
 * Business logic should NOT live here – only query construction.
 */
class EmployeeRepository {
  /**
   * Find a single employee by primary key (UUID).
   * Returns null if not found (respects soft-deletes automatically).
   */
  async findById(id) {
    return Employee.findByPk(id);
  }

  /**
   * Find an employee by their unique employee code.
   */
  async findByCode(employeeCode) {
    return Employee.findOne({ where: { employeeCode } });
  }

  /**
   * Find an employee by email address.
   */
  async findByEmail(email) {
    return Employee.findOne({ where: { email } });
  }

  /**
   * Paginated list of employees with optional filters.
   * @param {object} filters  - { department, isActive, search }
   * @param {number} page     - 1-indexed page number
   * @param {number} limit    - records per page
   */
  async findAll({ department, isActive, search } = {}, page = 1, limit = 20) {
    const where = {};

    if (department) where.department = department;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employeeCode: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    return Employee.findAndCountAll({
      where,
      limit,
      offset,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      attributes: { exclude: ['passwordHash'] },
    });
  }

  /**
   * Create a new employee record.
   */
  async create(data) {
    return Employee.create(data);
  }

  /**
   * Update an employee record by primary key.
   * Returns the updated instance, or null if not found.
   */
  async update(id, data) {
    const employee = await Employee.findByPk(id);
    if (!employee) return null;
    return employee.update(data);
  }

  /**
   * Soft-delete an employee (sets deleted_at).
   */
  async delete(id) {
    const employee = await Employee.findByPk(id);
    if (!employee) return false;
    await employee.destroy();
    return true;
  }

  /**
   * Check if an employee code or email is already taken (for uniqueness checks).
   * @param {string} field  - 'employeeCode' or 'email'
   * @param {string} value
   * @param {string} [excludeId]  - Exclude this UUID (useful on update)
   */
  async existsBy(field, value, excludeId = null) {
    const where = { [field]: value };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const count = await Employee.count({ where });
    return count > 0;
  }
}

module.exports = new EmployeeRepository();
