/**
 * Attendance domain model.
 * Encapsulates attendance record business rules and computed properties.
 */
class Attendance {
  // Standard workday duration in hours used for late/half-day calculations
  static WORK_DAY_HOURS = 8;
  static LATE_THRESHOLD_MINUTES = 15;

  constructor(data) {
    this.id = data.id;
    this.employeeId = data.employee_id;
    this.date = data.date;
    this.checkIn = data.check_in ? new Date(data.check_in) : null;
    this.checkOut = data.check_out ? new Date(data.check_out) : null;
    this.status = data.status;
    this.notes = data.notes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Calculates total hours worked. Returns null if check-out is not recorded.
   */
  get totalHours() {
    if (!this.checkIn || !this.checkOut) return null;
    const diffMs = this.checkOut.getTime() - this.checkIn.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  get isCheckedOut() {
    return this.checkOut !== null;
  }

  toJSON() {
    return {
      id: this.id,
      employee_id: this.employeeId,
      date: this.date,
      check_in: this.checkIn,
      check_out: this.checkOut,
      status: this.status,
      notes: this.notes,
      total_hours: this.totalHours,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  static fromDB(row) {
    return new Attendance(row);
  }
}

module.exports = Attendance;
