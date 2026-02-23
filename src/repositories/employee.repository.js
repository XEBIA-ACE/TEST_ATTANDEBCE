const { Op } = require('sequelize');
const { Employee, Department } = require('../models');

/**
 * Data-access layer for Employee.
 * Controllers must never import Sequelize models directly — use this class.
 */
class EmployeeRepository {
  /**
   * Find all employees with optional filtering and pagination.
   */
  async findAll({ page = 1, limit = 20, search, departmentId, isActive, employmentType } = {}) {
    const where = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (departmentId) where.departmentId = departmentId;
    if (employmentType) where.employmentType = employmentType;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
      limit,
      offset,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });

    return { count, rows };
  }

  /**
   * Find a single employee by primary key (UUID).
   */
  async findById(id) {
    return Employee.findByPk(id, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
    });
  }

  /**
   * Find by unique email.
   */
  async findByEmail(email) {
    return Employee.findOne({ where: { email } });
  }

  /**
   * Create a new employee record.
   * @param {object} data - Validated employee payload
   */
  async create(data) {
    return Employee.create(data);
  }

  /**
   * Update an existing employee by PK.
   * @returns {Employee} Updated instance
   */
  async update(id, data) {
    const [affectedCount, [updated]] = await Employee.update(data, {
      where: { id },
      returning: true,
    });
    if (affectedCount === 0) return null;
    return updated;
  }

  /**
   * Soft-delete an employee (paranoid: true).
   */
  async delete(id) {
    const employee = await Employee.findByPk(id);
    if (!employee) return false;
    await employee.destroy();
    return true;
  }
}

module.exports = new EmployeeRepository();
