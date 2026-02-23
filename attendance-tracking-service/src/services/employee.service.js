const EmployeeRepository = require('../repositories/employee.repository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

/**
 * Business Logic Layer for Employee operations.
 * Orchestrates repository calls and applies domain rules.
 */
class EmployeeService {
  constructor() {
    this.repository = new EmployeeRepository();
  }

  /**
   * List employees with pagination and filtering.
   */
  async listEmployees(query) {
    const { page, limit, offset } = parsePagination(query);
    const { status, department, search } = query;

    const { rows, total } = await this.repository.findAll({
      page, limit, offset, status, department, search,
    });

    logger.info('Listed employees', { count: rows.length, total, page, limit });

    return {
      data: rows,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Get a single employee by ID.
   */
  async getEmployee(id) {
    const employee = await this.repository.findById(id);
    return employee;
  }

  /**
   * Create a new employee.
   */
  async createEmployee(data) {
    const employee = await this.repository.create(data);
    logger.info('Employee created', { id: employee.id, email: employee.email });
    return employee;
  }

  /**
   * Update an existing employee's details.
   */
  async updateEmployee(id, data) {
    const employee = await this.repository.update(id, data);
    logger.info('Employee updated', { id });
    return employee;
  }

  /**
   * Soft-delete an employee.
   */
  async deleteEmployee(id) {
    const result = await this.repository.delete(id);
    logger.info('Employee deleted', { id });
    return result;
  }
}

module.exports = EmployeeService;
