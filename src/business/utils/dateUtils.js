/**
 * Date utility functions for attendance calculations.
 */

/**
 * Returns the start of the current day in ISO format (UTC midnight).
 * @param {Date} [date=new Date()] - Reference date
 * @returns {string} ISO date-time string
 */
const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

/**
 * Returns the end of the current day in ISO format (UTC 23:59:59.999).
 * @param {Date} [date=new Date()] - Reference date
 * @returns {string} ISO date-time string
 */
const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
};

/**
 * Calculates total worked hours between two timestamps.
 * Returns null if either timestamp is missing.
 *
 * @param {string|Date} checkIn
 * @param {string|Date} checkOut
 * @returns {number|null} Hours worked (rounded to 2 decimal places)
 */
const calculateWorkedHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const diffMs = new Date(checkOut) - new Date(checkIn);
  if (diffMs < 0) return null;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

/**
 * Formats a duration in milliseconds into "Xh Ym" string.
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 */
const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0h 0m';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

/**
 * Returns an array of date strings for each day in a range (inclusive).
 * @param {string|Date} start
 * @param {string|Date} end
 * @returns {string[]} Array of YYYY-MM-DD strings
 */
const getDateRange = (start, end) => {
  const dates = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Checks if a date falls on a weekend (Saturday or Sunday).
 * @param {string|Date} date
 * @returns {boolean}
 */
const isWeekend = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  return day === 0 || day === 6;
};

module.exports = { startOfDay, endOfDay, calculateWorkedHours, formatDuration, getDateRange, isWeekend };
