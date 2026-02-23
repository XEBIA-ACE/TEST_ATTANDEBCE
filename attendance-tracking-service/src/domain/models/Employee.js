'use strict';

/**
 * Employee domain model.
 * Pure business logic — no database concerns.
 */
class Employee {
  static STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ON_LEAVE: 'on_leave',
  };

  static ALLOWED_STATUSES = Object.values(Employee.STATUS);

  constructor(data) {
    this.id = data.id;
    this.employee_number = data.employee_number;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.department = data.department;
    this.position = data.position;
    this.status = data.status || Employee.STATUS.ACTIVE;
    this.hire_date = data.hire_date;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  isActive() {
    return this.status === Employee.STATUS.ACTIVE;
  }

  isOnLeave() {
    return this.status === Employee.STATUS.ON_LEAVE;
  }

  toJSON() {
    return {
      id: this.id,
      employee_number: this.employee_number,
      first_name: this.first_name,
      last_name: this.last_name,
      full_name: this.fullName,
      email: this.email,
      department: this.department,
      position: this.position,
      status: this.status,
      hire_date: this.hire_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Employee;
