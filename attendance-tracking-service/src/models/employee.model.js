'use strict';

/**
 * Employee domain model.
 * Maps raw DB rows to a clean domain object and provides simple factory helpers.
 */
class Employee {
  constructor({
    id,
    employee_code,
    first_name,
    last_name,
    email,
    department,
    position,
    hire_date,
    is_active,
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.employeeCode = employee_code;
    this.firstName = first_name;
    this.lastName = last_name;
    this.email = email;
    this.department = department || null;
    this.position = position || null;
    this.hireDate = hire_date || null;
    this.isActive = is_active;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Serialize to a plain object suitable for API responses.
   */
  toJSON() {
    return {
      id: this.id,
      employee_code: this.employeeCode,
      first_name: this.firstName,
      last_name: this.lastName,
      full_name: this.fullName,
      email: this.email,
      department: this.department,
      position: this.position,
      hire_date: this.hireDate,
      is_active: this.isActive,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  /**
   * Build an Employee instance from a raw database row.
   * @param {Object} row
   * @returns {Employee}
   */
  static fromRow(row) {
    return new Employee(row);
  }
}

module.exports = Employee;
