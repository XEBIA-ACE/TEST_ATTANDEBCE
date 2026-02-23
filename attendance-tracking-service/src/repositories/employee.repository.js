const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errors');

const TABLE = 'employees';

/**
 * Data Access Layer for Employee records.
 * All raw DB interactions are encapsulated here.
 */
class EmployeeRepository {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * Find all employees with optional filters and pagination.
   */
  async findAll({ page = 1, limit = 20, offset = 0, status, department, search } = {}) {
    let query = this.db(TABLE).whereNull('deleted_at');

    if (status) query = query.where('status', status);
    if (department) query = query.where('department', department);
    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('employee_code', `%${search}%`);
      });
    }

    const countQuery = query.clone().count('id as count').first();
    const [{ count }, rows] = await Promise.all([
      countQuery,
      query.clone().orderBy('last_name', 'asc').limit(limit).offset(offset),
    ]);

    return { rows, total: parseInt(count) };
  }

  /**
   * Find a single employee by ID. Throws NotFoundError if missing.
   */
  async findById(id) {
    const employee = await this.db(TABLE).where({ id }).whereNull('deleted_at').first();
    if (!employee) throw new NotFoundError('Employee');
    return employee;
  }

  /**
   * Find a single employee by email (case-insensitive).
   */
  async findByEmail(email) {
    return this.db(TABLE).whereRaw('LOWER(email) = ?', [email.toLowerCase()]).whereNull('deleted_at').first();
  }

  /**
   * Find a single employee by employee_code.
   */
  async findByCode(employee_code) {
    return this.db(TABLE).where({ employee_code }).whereNull('deleted_at').first();
  }

  /**
   * Create a new employee record.
   */
  async create(data) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictError(`Employee with email '${data.email}' already exists`);

    const codeExists = await this.findByCode(data.employee_code);
    if (codeExists) throw new ConflictError(`Employee code '${data.employee_code}' is already taken`);

    const id = uuidv4();
    const now = new Date().toISOString();

    const record = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };

    await this.db(TABLE).insert(record);
    return this.findById(id);
  }

  /**
   * Update an existing employee record by ID.
   */
  async update(id, data) {
    await this.findById(id); // Ensures record exists

    if (data.email) {
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Email '${data.email}' is already in use`);
      }
    }

    await this.db(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date().toISOString() });

    return this.findById(id);
  }

  /**
   * Soft-delete an employee by setting deleted_at timestamp.
   */
  async delete(id) {
    await this.findById(id); // Ensures record exists
    await this.db(TABLE).where({ id }).update({ deleted_at: new Date().toISOString() });
    return { id, deleted: true };
  }
}

module.exports = EmployeeRepository;
