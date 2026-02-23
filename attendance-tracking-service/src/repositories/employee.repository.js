'use strict';

const { query } = require('../config/database');
const Employee = require('../models/employee.model');

/**
 * Data-access layer for employees.
 * All SQL lives here; no SQL in services or controllers.
 */
class EmployeeRepository {
  /**
   * Retrieve a paginated, filterable list of employees.
   * @param {{ page: number, limit: number, department?: string, isActive?: boolean, search?: string }} options
   * @returns {Promise<{ employees: Employee[], total: number }>}
   */
  async findAll({ page = 1, limit = 20, department, isActive, search } = {}) {
    const params = [];
    const conditions = [];

    if (department) {
      params.push(department);
      conditions.push(`department = $${params.length}`);
    }

    if (isActive !== undefined) {
      params.push(isActive);
      conditions.push(`is_active = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR employee_code ILIKE $${params.length} OR email ILIKE $${params.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total for pagination metadata
    const countResult = await query(
      `SELECT COUNT(*) FROM employees ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch page
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM employees ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      employees: result.rows.map(Employee.fromRow),
      total,
    };
  }

  /**
   * Find an employee by primary key.
   * @param {string} id - UUID
   * @returns {Promise<Employee|null>}
   */
  async findById(id) {
    const result = await query('SELECT * FROM employees WHERE id = $1', [id]);
    return result.rows.length ? Employee.fromRow(result.rows[0]) : null;
  }

  /**
   * Find an employee by unique employee_code.
   * @param {string} code
   * @returns {Promise<Employee|null>}
   */
  async findByCode(code) {
    const result = await query(
      'SELECT * FROM employees WHERE employee_code = $1',
      [code]
    );
    return result.rows.length ? Employee.fromRow(result.rows[0]) : null;
  }

  /**
   * Find an employee by email.
   * @param {string} email
   * @returns {Promise<Employee|null>}
   */
  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM employees WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows.length ? Employee.fromRow(result.rows[0]) : null;
  }

  /**
   * Insert a new employee row.
   * @param {{ employee_code, first_name, last_name, email, department, position, hire_date }} data
   * @returns {Promise<Employee>}
   */
  async create(data) {
    const { employee_code, first_name, last_name, email, department, position, hire_date } = data;
    const result = await query(
      `INSERT INTO employees (employee_code, first_name, last_name, email, department, position, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [employee_code, first_name, last_name, email.toLowerCase(), department, position, hire_date]
    );
    return Employee.fromRow(result.rows[0]);
  }

  /**
   * Update an existing employee; only provided fields are changed.
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Employee|null>}
   */
  async update(id, updates) {
    const allowed = ['first_name', 'last_name', 'email', 'department', 'position', 'hire_date', 'is_active'];
    const setClauses = [];
    const params = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        params.push(key === 'email' ? updates[key].toLowerCase() : updates[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    const result = await query(
      `UPDATE employees SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows.length ? Employee.fromRow(result.rows[0]) : null;
  }

  /**
   * Soft-delete: mark employee as inactive.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deactivate(id) {
    const result = await query(
      'UPDATE employees SET is_active = FALSE WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  /**
   * Hard-delete (use with caution; cascades to attendance_records).
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM employees WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
}

module.exports = new EmployeeRepository();
