const db = require('../../config/database');
const { TABLE, fromDb, toDb } = require('../models/attendance');

/**
 * Data access layer for attendance records.
 */

/**
 * Creates a new attendance record.
 * @param {Object} data
 * @returns {Object}
 */
const create = async (data) => {
  const [row] = await db(TABLE).insert(toDb(data)).returning('*');
  // Fetch with employee join for the response
  return findById(row.id);
};

/**
 * Returns a single attendance record, joined with employee name.
 * @param {string} id
 * @returns {Object|null}
 */
const findById = async (id) => {
  const row = await db(TABLE)
    .select(
      `${TABLE}.*`,
      'e.first_name',
      'e.last_name',
      'e.department'
    )
    .join('employees as e', `${TABLE}.employee_id`, 'e.id')
    .where(`${TABLE}.id`, id)
    .first();
  return fromDb(row);
};

/**
 * Finds an open (not yet checked-out) record for an employee on a specific day.
 * Used to enforce single check-in per day.
 *
 * @param {string} employeeId
 * @param {string} dayStart - ISO datetime (start of day)
 * @param {string} dayEnd   - ISO datetime (end of day)
 * @returns {Object|null}
 */
const findOpenRecord = async (employeeId, dayStart, dayEnd) => {
  const row = await db(TABLE)
    .where({ employee_id: employeeId, status: 'checked_in' })
    .whereBetween('check_in_time', [dayStart, dayEnd])
    .first();
  return row ? fromDb(row) : null;
};

/**
 * Paginated, filtered list of attendance records.
 *
 * @param {Object} params
 * @returns {Object[]}
 */
const findAll = async ({ employeeId, department, startDate, endDate, status, sortBy, sortOrder, limit, offset }) => {
  const columnMap = {
    checkInTime: `${TABLE}.check_in_time`,
    checkOutTime: `${TABLE}.check_out_time`,
    createdAt: `${TABLE}.created_at`,
  };

  const query = db(TABLE)
    .select(
      `${TABLE}.*`,
      'e.first_name',
      'e.last_name',
      'e.department'
    )
    .join('employees as e', `${TABLE}.employee_id`, 'e.id');

  if (employeeId) query.where(`${TABLE}.employee_id`, employeeId);
  if (department) query.where('e.department', department);
  if (status) query.where(`${TABLE}.status`, status);
  if (startDate) query.where(`${TABLE}.check_in_time`, '>=', new Date(startDate).toISOString());
  if (endDate) query.where(`${TABLE}.check_in_time`, '<=', new Date(endDate).toISOString());

  const col = columnMap[sortBy] || `${TABLE}.check_in_time`;
  query.orderBy(col, sortOrder || 'desc');
  query.limit(limit).offset(offset);

  const rows = await query;
  return rows.map(fromDb);
};

/**
 * Counts total records matching the given filters.
 * @param {Object} filters
 * @returns {number}
 */
const count = async ({ employeeId, department, startDate, endDate, status }) => {
  const query = db(TABLE)
    .join('employees as e', `${TABLE}.employee_id`, 'e.id');

  if (employeeId) query.where(`${TABLE}.employee_id`, employeeId);
  if (department) query.where('e.department', department);
  if (status) query.where(`${TABLE}.status`, status);
  if (startDate) query.where(`${TABLE}.check_in_time`, '>=', new Date(startDate).toISOString());
  if (endDate) query.where(`${TABLE}.check_in_time`, '<=', new Date(endDate).toISOString());

  const [{ count: total }] = await query.count(`${TABLE}.id as count`);
  return parseInt(total, 10);
};

/**
 * Updates fields on an existing attendance record.
 * @param {string} id
 * @param {Object} data
 * @returns {Object}
 */
const update = async (id, data) => {
  await db(TABLE)
    .where({ id })
    .update({ ...toDb(data), updated_at: db.fn.now() });
  return findById(id);
};

module.exports = { create, findById, findOpenRecord, findAll, count, update };
