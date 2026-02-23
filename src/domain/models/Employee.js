/**
 * Employee domain model.
 * Encapsulates employee business rules and computed properties.
 */
class Employee {
  constructor(data) {
    this.id = data.id;
    this.employeeCode = data.employee_code;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.email = data.email;
    this.department = data.department;
    this.position = data.position;
    this.status = data.status;
    this.hireDate = data.hire_date;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive() {
    return this.status === 'active';
  }

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
      status: this.status,
      hire_date: this.hireDate,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  static fromDB(row) {
    return new Employee(row);
  }
}

module.exports = Employee;
