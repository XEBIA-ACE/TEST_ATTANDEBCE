'use strict';

const { getDatabase } = require('../config/database');

const TABLE = 'employees';

// Columns returned by default (excludes sensitive data like password_hash)
const PUBLIC_COLUMNS = [
  'id',
  'employee_code',
  'first_name',
  'last_name',
  'email',
  'phone',
  'department',
  'position',
  'manager_id',
  'status',
  'hire_date',
  'created_at',
  'updated_at',
];

/**
 * Data-access layer for the employees table.
 * All methods accept/return plain objects — no business logic here.
 */
class EmployeeRepository {
  get db() {
    return getDatabase();
  }

  /** @returns {Promise<{ rows: object[], total: number }>} */
  async findAll({ page = 1, limit = 20, department, status, search } = {}) {
    const offset = (page - 1) * limit;

    const query = this.db(TABLE).select(PUBLIC_COLUMNS);

    if (department) query.where({ department });
    if (status) query.where({ status });
    if (search) {
      query.where((builder) => {
        builder
          .whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('employee_code', `%${search}%`);
      });
    }

    const countQuery = query.clone().clearSelect().count('* as count').first();
    const [{ count }, rows] = await Promise.all([
      countQuery,
      query.orderBy('created_at', 'desc').limit(limit).offset(offset),
    ]);

    return { rows, total: Number(count) };
  }

  /** @returns {Promise<object|null>} */
  async findById(id) {
    return this.db(TABLE).select(PUBLIC_COLUMNS).where({ id }).first() || null;
  }

  /** @returns {Promise<object|null>} */
  async findByEmail(email) {
    return this.db(TABLE).where({ email }).first() || null;
  }

  /** @returns {Promise<object|null>} */
  async findByCode(employee_code) {
    return this.db(TABLE).select(PUBLIC_COLUMNS).where({ employee_code }).first() || null;
  }

  /** @returns {Promise<object>} The newly created employee (public columns) */
  async create(data) {
    const [employee] = await this.db(TABLE).insert(data).returning(PUBLIC_COLUMNS);
    return employee;
  }

  /** @returns {Promise<object|null>} The updated employee, or null if not found */
  async update(id, data) {
    const [employee] = await this.db(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning(PUBLIC_COLUMNS);
    return employee || null;
  }

  /** @returns {Promise<boolean>} */
  async delete(id) {
    const count = await this.db(TABLE).where({ id }).delete();
    return count > 0;
  }

  /** @returns {Promise<boolean>} */
  async exists(id) {
    const row = await this.db(TABLE).where({ id }).select('id').first();
    return Boolean(row);
  }
}

module.exports = new EmployeeRepository();
