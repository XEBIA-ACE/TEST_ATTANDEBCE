const db = require('../../config/database');
const { TABLE, fromDb, toDb } = require('../models/employee');

/**
 * Data access layer for employees.
 * All queries are encapsulated here — no raw SQL leaks to upper layers.
 */

/**
 * Creates a new employee row.
 * @param {Object} data - camelCase employee payload (must include id)
 * @returns {Object} Created employee (camelCase)
 */
const create = async (data) => {
  const [row] = await db(TABLE).insert(toDb(data)).returning('*');
  return fromDb(row);
};

/**
 * Finds an employee by primary key.
 * @param {string} id
 * @returns {Object|null}
 */
const findById = async (id) => {
  const row = await db(TABLE).where({ id }).first();
  return fromDb(row);
};

/**
 * Finds an employee by email address.
 * @param {string} email
 * @returns {Object|null}
 */
const findByEmail = async (email) => {
  const row = await db(TABLE).where({ email }).first();
  return fromDb(row);
};

/**
 * Returns a paginated, filtered list of employees.
 *
 * @param {Object} params - Filters + limit + offset
 * @returns {Object[]}
 */
const findAll = async ({ department, employmentType, isActive, search, sortBy, sortOrder, limit, offset }) => {
  const columnMap = {
    firstName: 'first_name',
    lastName: 'last_name',
    department: 'department',
    hireDate: 'hire_date',
    createdAt: 'created_at',
  };

  const query = db(TABLE);

  if (department) query.where({ department });
  if (employmentType) query.where({ employment_type: employmentType });
  if (isActive !== undefined) query.where({ is_active: isActive });

  if (search) {
    query.where((qb) => {
      qb.whereILike('first_name', `%${search}%`)
        .orWhereILike('last_name', `%${search}%`)
        .orWhereILike('email', `%${search}%`);
    });
  }

  const col = columnMap[sortBy] || 'created_at';
  query.orderBy(col, sortOrder || 'desc');
  query.limit(limit).offset(offset);

  const rows = await query;
  return rows.map(fromDb);
};

/**
 * Counts total employees matching the given filters (without pagination).
 *
 * @param {Object} filters
 * @returns {number}
 */
const count = async ({ department, employmentType, isActive, search }) => {
  const query = db(TABLE);

  if (department) query.where({ department });
  if (employmentType) query.where({ employment_type: employmentType });
  if (isActive !== undefined) query.where({ is_active: isActive });

  if (search) {
    query.where((qb) => {
      qb.whereILike('first_name', `%${search}%`)
        .orWhereILike('last_name', `%${search}%`)
        .orWhereILike('email', `%${search}%`);
    });
  }

  const [{ count: total }] = await query.count('id as count');
  return parseInt(total, 10);
};

/**
 * Updates fields on an existing employee row.
 * Automatically sets updated_at.
 *
 * @param {string} id
 * @param {Object} data - camelCase fields to update
 * @returns {Object} Updated employee
 */
const update = async (id, data) => {
  const [row] = await db(TABLE)
    .where({ id })
    .update({ ...toDb(data), updated_at: db.fn.now() })
    .returning('*');
  return fromDb(row);
};

module.exports = { create, findById, findByEmail, findAll, count, update };
