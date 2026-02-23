'use strict';

/**
 * Valid attendance status values (mirrors the DB enum).
 */
const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half_day',
  HOLIDAY: 'holiday',
  LEAVE: 'leave',
});

/**
 * AttendanceRecord domain model.
 */
class AttendanceRecord {
  constructor({
    id,
    employee_id,
    date,
    check_in_time,
    check_out_time,
    status,
    notes,
    total_hours,
    created_at,
    updated_at,
    // Optional joined fields
    employee_code,
    first_name,
    last_name,
    department,
  }) {
    this.id = id;
    this.employeeId = employee_id;
    this.date = date;
    this.checkInTime = check_in_time || null;
    this.checkOutTime = check_out_time || null;
    this.status = status;
    this.notes = notes || null;
    this.totalHours = total_hours !== undefined ? total_hours : null;
    this.createdAt = created_at;
    this.updatedAt = updated_at;

    // Populated when joining with employees table
    this.employeeCode = employee_code || null;
    this.employeeFirstName = first_name || null;
    this.employeeLastName = last_name || null;
    this.department = department || null;
  }

  get isCheckedOut() {
    return this.checkOutTime !== null;
  }

  toJSON() {
    const obj = {
      id: this.id,
      employee_id: this.employeeId,
      date: this.date,
      check_in_time: this.checkInTime,
      check_out_time: this.checkOutTime,
      status: this.status,
      notes: this.notes,
      total_hours: this.totalHours ? parseFloat(this.totalHours) : null,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };

    if (this.employeeCode) {
      obj.employee = {
        employee_code: this.employeeCode,
        first_name: this.employeeFirstName,
        last_name: this.employeeLastName,
        department: this.department,
      };
    }

    return obj;
  }

  static fromRow(row) {
    return new AttendanceRecord(row);
  }
}

module.exports = { AttendanceRecord, ATTENDANCE_STATUS };
