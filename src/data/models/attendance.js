/**
 * Attendance model — column name mapping between snake_case (DB) and camelCase (JS).
 */
const TABLE = 'attendance_records';

/**
 * Converts a DB row (snake_case) into a camelCase JS object.
 * Parses JSON location strings and joins employee name columns.
 *
 * @param {Object} row
 * @returns {Object}
 */
const fromDb = (row) => {
  if (!row) return null;

  const parseLocation = (loc) => {
    if (!loc) return null;
    try {
      return JSON.parse(loc);
    } catch {
      return null;
    }
  };

  return {
    id: row.id,
    employeeId: row.employee_id,
    // Joined employee fields (present when using findAll with a join)
    firstName: row.first_name,
    lastName: row.last_name,
    department: row.department,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    workedHours: row.worked_hours ? parseFloat(row.worked_hours) : null,
    status: row.status,
    checkInNotes: row.check_in_notes,
    checkOutNotes: row.check_out_notes,
    checkInLocation: parseLocation(row.check_in_location),
    checkOutLocation: parseLocation(row.check_out_location),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Converts a camelCase payload to DB columns for INSERT/UPDATE.
 *
 * @param {Object} data
 * @returns {Object}
 */
const toDb = (data) => {
  const mapping = {
    id: 'id',
    employeeId: 'employee_id',
    checkInTime: 'check_in_time',
    checkOutTime: 'check_out_time',
    workedHours: 'worked_hours',
    status: 'status',
    checkInNotes: 'check_in_notes',
    checkOutNotes: 'check_out_notes',
    checkInLocation: 'check_in_location',
    checkOutLocation: 'check_out_location',
  };

  return Object.entries(data).reduce((acc, [key, value]) => {
    if (mapping[key] !== undefined) {
      acc[mapping[key]] = value;
    }
    return acc;
  }, {});
};

module.exports = { TABLE, fromDb, toDb };
