const employeeRepository = require('../repositories/employee.repository');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Business logic layer for Employee operations.
 * Repositories handle persistence; this layer enforces business rules.
 */
class EmployeeService {
  /**
   * Retrieve a paginated list of employees.
   */
  async listEmployees(filters) {
    const { count, rows } = await employeeRepository.findAll(filters);
    return { count, employees: rows.map((e) => e.toJSON()) };
  }

  /**
   * Get a single employee by ID. Throws NotFoundError if missing.
   */
  async getEmployee(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new NotFoundError('Employee');
    return employee.toJSON();
  }

  /**
   * Create a new employee, ensuring the email is unique.
   */
  async createEmployee(data) {
    const existing = await employeeRepository.findByEmail(data.email);
    if (existing) throw new ConflictError(`Email '${data.email}' is already in use`);

    const employee = await employeeRepository.create(data);
    return employee.toJSON();
  }

  /**
   * Update an employee record.
   * If the email is being changed, verify it is not already taken by another employee.
   */
  async updateEmployee(id, data) {
    // Check employee exists
    const current = await employeeRepository.findById(id);
    if (!current) throw new NotFoundError('Employee');

    if (data.email && data.email !== current.email) {
      const conflict = await employeeRepository.findByEmail(data.email);
      if (conflict) throw new ConflictError(`Email '${data.email}' is already in use`);
    }

    const updated = await employeeRepository.update(id, data);
    return updated.toJSON();
  }

  /**
   * Soft-delete an employee.
   */
  async deleteEmployee(id) {
    const deleted = await employeeRepository.delete(id);
    if (!deleted) throw new NotFoundError('Employee');
  }
}

module.exports = new EmployeeService();
