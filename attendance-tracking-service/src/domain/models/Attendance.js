'use strict';

/**
 * Attendance domain model.
 * Encapsulates business rules for attendance records.
 */
class Attendance {
  static STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    HALF_DAY: 'half_day',
    ON_LEAVE: 'on_leave',
  };

  static ALLOWED_STATUSES = Object.values(Attendance.STATUS);

  /** Work hours threshold for "late" classification (minutes after expected start) */
  static LATE_THRESHOLD_MINUTES = 15;

  /** Minimum hours for a full day (used for half_day classification) */
  static FULL_DAY_HOURS = 4;

  constructor(data) {
    this.id = data.id;
    this.employee_id = data.employee_id;
    this.date = data.date;
    this.check_in = data.check_in ? new Date(data.check_in) : null;
    this.check_out = data.check_out ? new Date(data.check_out) : null;
    this.status = data.status || Attendance.STATUS.ABSENT;
    this.total_hours = data.total_hours || null;
    this.notes = data.notes || null;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Calculates total worked hours between check-in and check-out.
   * @returns {number|null} Hours worked, rounded to 2 decimal places.
   */
  calculateTotalHours() {
    if (!this.check_in || !this.check_out) return null;
    const diffMs = this.check_out - this.check_in;
    if (diffMs < 0) return null;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  /**
   * Determines attendance status based on check-in time and expected start.
   * @param {Date} expectedStart - Expected work start time.
   * @returns {string} Computed attendance status.
   */
  computeStatus(expectedStart = null) {
    if (!this.check_in) return Attendance.STATUS.ABSENT;

    if (expectedStart) {
      const diffMinutes = (this.check_in - expectedStart) / (1000 * 60);
      if (diffMinutes > Attendance.LATE_THRESHOLD_MINUTES) {
        return Attendance.STATUS.LATE;
      }
    }

    const hours = this.calculateTotalHours();
    if (hours !== null && hours < Attendance.FULL_DAY_HOURS) {
      return Attendance.STATUS.HALF_DAY;
    }

    return Attendance.STATUS.PRESENT;
  }

  hasCheckedOut() {
    return this.check_out !== null;
  }

  toJSON() {
    return {
      id: this.id,
      employee_id: this.employee_id,
      date: this.date,
      check_in: this.check_in,
      check_out: this.check_out,
      status: this.status,
      total_hours: this.total_hours,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Attendance;
