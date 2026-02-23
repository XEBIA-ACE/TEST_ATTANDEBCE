'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

/**
 * Attendance status values:
 *  - present    : checked in, may still be checked in
 *  - absent     : manually marked absent (no check-in record)
 *  - late        : checked in but after the expected start threshold
 *  - half_day   : worked less than half of expected hours
 *  - on_leave   : on approved leave
 */
const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'half_day', 'on_leave'];

class Attendance extends Model {
  /**
   * Compute worked duration in hours from check_in and check_out timestamps.
   * Returns null if the employee hasn't checked out yet.
   */
  get workedHours() {
    if (!this.checkIn || !this.checkOut) return null;
    const diffMs = new Date(this.checkOut) - new Date(this.checkIn);
    return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  }
}

Attendance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id',
      references: { model: 'employees', key: 'id' },
      onDelete: 'CASCADE',
    },
    // The calendar date this record belongs to (YYYY-MM-DD)
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Calendar date of the attendance record',
    },
    checkIn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'check_in',
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'check_out',
    },
    // Stored in decimal hours, recomputed on check-out
    workedHoursStored: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'worked_hours',
    },
    status: {
      type: DataTypes.ENUM(...ATTENDANCE_STATUS),
      allowNull: false,
      defaultValue: 'present',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional manager/employee notes',
    },
    // IP address recorded on check-in for audit trail
    checkInIp: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'check_in_ip',
    },
    checkOutIp: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'check_out_ip',
    },
  },
  {
    sequelize,
    modelName: 'Attendance',
    tableName: 'attendance_records',
    underscored: false,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      // Enforce one record per employee per day
      { unique: true, fields: ['employee_id', 'date'] },
      { fields: ['date'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = { Attendance, ATTENDANCE_STATUS };
