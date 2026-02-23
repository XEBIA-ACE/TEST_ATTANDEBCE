'use strict';

const { db } = require('../db');

const TABLE = 'employees';

/**
 * Data Access Layer for employees.
 * All database queries for employees are isolated here.
 */
const employeeRepository = {
  /**
   * Find all employees with optional filters and pagination.
   */
  async findAll({ status, department, search, page = 1, limit = 20 } = {}) {
    const query = db(TABLE).orderBy('created_at', 'desc');

    if (status) query.where('status', status);
    if (department) query.where('department', department);
    if (search) {
      query.where((builder) => {
        builder
          .whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('employee_code', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('* as count');
    const total = parseInt(count, 10);

    const offset = (page - 1) * limit;
    const data = await query.limit(limit).offset(offset);

    return { data, total };
  },

  async findById(id) {
    return db(TABLE).where({ id }).first();
  },

  async findByEmployeeCode(code) {
    return db(TABLE).where({ employee_code: code }).first();
  },

  async findByEmail(email) {
    return db(TABLE).where({ email }).first();
  },

  async create(employeeData) {
    const [employee] = await db(TABLE).insert(employeeData).returning('*');
    return employee;
  },

  async update(id, employeeData) {
    const [employee] = await db(TABLE)
      .where({ id })
      .update({ ...employeeData, updated_at: db.fn.now() })
      .returning('*');
    return employee;
  },

  async delete(id) {
    return db(TABLE).where({ id }).delete();
  },

  async getDepartments() {
    return db(TABLE)
      .distinct('department')
      .whereNotNull('department')
      .orderBy('department')
      .pluck('department');
  },
};

module.exports = employeeRepository;
