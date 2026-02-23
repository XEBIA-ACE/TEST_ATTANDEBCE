/**
 * Attendance model constants and validation schemas.
 */
const Joi = require('joi');

const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half_day',
  ON_LEAVE: 'on_leave',
  HOLIDAY: 'holiday',
});

// Standard work shift thresholds (minutes after scheduled start)
const LATE_THRESHOLD_MINUTES = 15;
const HALF_DAY_THRESHOLD_HOURS = 4;

const checkInSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
  location: Joi.string().trim().max(255).optional().allow('', null),
});

const checkOutSchema = Joi.object({
  notes: Joi.string().trim().max(500).optional().allow('', null),
  location: Joi.string().trim().max(255).optional().allow('', null),
});

const createAttendanceSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  date: Joi.string().isoDate().required(),
  check_in: Joi.string().isoDate().optional().allow('', null),
  check_out: Joi.string().isoDate().optional().allow('', null),
  status: Joi.string()
    .valid(...Object.values(ATTENDANCE_STATUS))
    .required(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
});

const updateAttendanceSchema = Joi.object({
  check_in: Joi.string().isoDate().optional().allow('', null),
  check_out: Joi.string().isoDate().optional().allow('', null),
  status: Joi.string()
    .valid(...Object.values(ATTENDANCE_STATUS))
    .optional(),
  notes: Joi.string().trim().max(500).optional().allow('', null),
}).min(1);

const attendanceQuerySchema = Joi.object({
  employee_id: Joi.string().uuid().optional(),
  date_from: Joi.string().isoDate().optional(),
  date_to: Joi.string().isoDate().optional(),
  status: Joi.string()
    .valid(...Object.values(ATTENDANCE_STATUS))
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

/**
 * Calculate total hours worked from check_in and check_out timestamps.
 * Returns null if either timestamp is missing.
 * @param {string|Date} checkIn
 * @param {string|Date} checkOut
 * @returns {number|null}
 */
function calculateHoursWorked(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end - start;
  if (diffMs <= 0) return null;
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
}

/**
 * Determine attendance status based on check-in time and scheduled start.
 * @param {string|Date} checkIn - Actual check-in time
 * @param {string|Date} scheduledStart - Expected work start time
 * @returns {string} ATTENDANCE_STATUS value
 */
function deriveStatus(checkIn, scheduledStart) {
  if (!checkIn) return ATTENDANCE_STATUS.ABSENT;
  const actual = new Date(checkIn);
  const expected = new Date(scheduledStart);
  const diffMinutes = (actual - expected) / (1000 * 60);
  if (diffMinutes > LATE_THRESHOLD_MINUTES) return ATTENDANCE_STATUS.LATE;
  return ATTENDANCE_STATUS.PRESENT;
}

module.exports = {
  ATTENDANCE_STATUS,
  LATE_THRESHOLD_MINUTES,
  HALF_DAY_THRESHOLD_HOURS,
  checkInSchema,
  checkOutSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  attendanceQuerySchema,
  calculateHoursWorked,
  deriveStatus,
};
