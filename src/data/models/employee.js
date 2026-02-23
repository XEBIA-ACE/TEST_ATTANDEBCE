/**
 * Employee model — column name mapping between snake_case (DB) and camelCase (JS).
 */
const TABLE = 'employees';

const COLUMNS = {
  id: 'id',
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  department: 'department',
  position: 'position',
  employmentType: 'employment_type',
  phone: 'phone',
  hireDate: 'hire_date',
  isActive: 'is_active',
  managerId: 'manager_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

/**
 * Converts a DB row (snake_case) into a camelCase JS object.
 * @param {Object} row
 * @returns {Object}
 */
const fromDb = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    department: row.department,
    position: row.position,
    employmentType: row.employment_type,
    phone: row.phone,
    hireDate: row.hire_date,
    isActive: row.is_active,
    managerId: row.manager_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Converts a camelCase payload into DB column names for INSERT/UPDATE.
 * Only includes keys that are present in the payload.
 *
 * @param {Object} data
 * @returns {Object}
 */
const toDb = (data) => {
  const mapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    department: 'department',
    position: 'position',
    employmentType: 'employment_type',
    phone: 'phone',
    hireDate: 'hire_date',
    isActive: 'is_active',
    managerId: 'manager_id',
    id: 'id',
  };

  return Object.entries(data).reduce((acc, [key, value]) => {
    if (mapping[key] !== undefined) {
      acc[mapping[key]] = value;
    }
    return acc;
  }, {});
};

module.exports = { TABLE, COLUMNS, fromDb, toDb };
