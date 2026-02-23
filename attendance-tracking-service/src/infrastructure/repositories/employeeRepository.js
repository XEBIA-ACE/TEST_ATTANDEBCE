'use strict';

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../config/database');
const Employee = require('../../domain/models/Employee');
const AppError = require('../../utils/AppError');

const TABLE = 'employees';

/**
 * Data access layer for Employee entities.
 * All database interactions are isolated here.
 */
class EmployeeRepository {
  constructor(db = null) {
    // Allow injecting a db instance for testing
    this._db = db;
  }

  get db() {
    return this._db || getDb();
  }

  /**
   * Retrieves all employees with optional filtering and pagination.
   */
  async findAll({ page = 1, limit = 20, status, department, search } = {}) {
    const offset = (page - 1) * limit;

    let query = this.db(TABLE).whereNull('deleted_at');

    if (status) query = query.where('status', status);
    if (department) query = query.where('department', department);
    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('employee_number', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('id as count');
    const rows = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    return {
      data: rows.map((row) => new Employee(row)),
      total: parseInt(count, 10),
      page,
      limit,
    };
  }

  /**
   * Retrieves a single employee by ID.
   * @throws {AppError} 404 if not found.
   */
  async findById(id) {
    const row = await this.db(TABLE).where({ id }).whereNull('deleted_at').first();
    if (!row) throw AppError.notFound(`Employee with id '${id}' not found`);
    return new Employee(row);
  }

  /**
   * Retrieves an employee by their unique employee number.
   */
  async findByEmployeeNumber(employeeNumber) {
    const row = await this.db(TABLE)
      .where({ employee_number: employeeNumber })
      .whereNull('deleted_at')
      .first();
    return row ? new Employee(row) : null;
  }

  /**
   * Retrieves an employee by email address.
   */
  async findByEmail(email) {
    const row = await this.db(TABLE)
      .where({ email: email.toLowerCase() })
      .whereNull('deleted_at')
      .first();
    return row ? new Employee(row) : null;
  }

  /**
   * Creates a new employee record.
   */
  async create(data) {
    const id = uuidv4();
    const now = new Date();

    const payload = {
      id,
      employee_number: data.employee_number,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.toLowerCase().trim(),
      department: data.department,
      position: data.position,
      status: data.status || Employee.STATUS.ACTIVE,
      hire_date: data.hire_date,
      created_at: now,
      updated_at: now,
    };

    await this.db(TABLE).insert(payload);
    return this.findById(id);
  }

  /**
   * Updates an existing employee record.
   */
  async update(id, data) {
    await this.findById(id); // Ensures record exists

    const payload = { ...data, updated_at: new Date() };

    // Normalize fields if present
    if (payload.email) payload.email = payload.email.toLowerCase().trim();
    if (payload.first_name) payload.first_name = payload.first_name.trim();
    if (payload.last_name) payload.last_name = payload.last_name.trim();

    await this.db(TABLE).where({ id }).update(payload);
    return this.findById(id);
  }

  /**
   * Soft-deletes an employee by setting deleted_at timestamp.
   */
  async delete(id) {
    await this.findById(id); // Ensures record exists
    await this.db(TABLE).where({ id }).update({ deleted_at: new Date() });
    return true;
  }

  /**
   * Checks whether an employee number is already in use.
   */
  async isEmployeeNumberTaken(employeeNumber, excludeId = null) {
    let query = this.db(TABLE).where({ employee_number: employeeNumber }).whereNull('deleted_at');
    if (excludeId) query = query.whereNot({ id: excludeId });
    const row = await query.first();
    return !!row;
  }

  /**
   * Checks whether an email is already in use.
   */
  async isEmailTaken(email, excludeId = null) {
    let query = this.db(TABLE)
      .where({ email: email.toLowerCase() })
      .whereNull('deleted_at');
    if (excludeId) query = query.whereNot({ id: excludeId });
    const row = await query.first();
    return !!row;
  }
}

module.exports = EmployeeRepository;
