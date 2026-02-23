const db = require('../../config/database');
const Employee = require('../../domain/models/Employee');

const TABLE = 'employees';

/**
 * Data access layer for Employee entities.
 * All database interactions are isolated here to keep the domain clean.
 */
class EmployeeRepository {
  /**
   * Retrieves a paginated list of employees with optional filters.
   */
  async findAll({ page = 1, limit = 20, department, status, search } = {}) {
    const offset = (page - 1) * limit;
    const query = db(TABLE).whereNull('deleted_at');

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

    const [{ count }] = await query.clone().count('id as count');
    const rows = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    return {
      data: rows.map(Employee.fromDB),
      pagination: {
        page,
        limit,
        total: parseInt(count),
        totalPages: Math.ceil(parseInt(count) / limit),
      },
    };
  }

  async findById(id) {
    const row = await db(TABLE).where({ id }).whereNull('deleted_at').first();
    return row ? Employee.fromDB(row) : null;
  }

  async findByEmail(email) {
    const row = await db(TABLE).where({ email }).whereNull('deleted_at').first();
    return row ? Employee.fromDB(row) : null;
  }

  async findByEmployeeCode(employeeCode) {
    const row = await db(TABLE)
      .where({ employee_code: employeeCode })
      .whereNull('deleted_at')
      .first();
    return row ? Employee.fromDB(row) : null;
  }

  async create(data) {
    const [row] = await db(TABLE).insert(data).returning('*');
    return Employee.fromDB(row);
  }

  async update(id, data) {
    const [row] = await db(TABLE)
      .where({ id })
      .whereNull('deleted_at')
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return row ? Employee.fromDB(row) : null;
  }

  /**
   * Soft delete — preserves attendance history integrity.
   */
  async delete(id) {
    const count = await db(TABLE)
      .where({ id })
      .whereNull('deleted_at')
      .update({ deleted_at: db.fn.now(), status: 'inactive' });
    return count > 0;
  }

  async getDepartments() {
    return db(TABLE)
      .whereNull('deleted_at')
      .distinct('department')
      .whereNotNull('department')
      .orderBy('department')
      .pluck('department');
  }
}

module.exports = new EmployeeRepository();
