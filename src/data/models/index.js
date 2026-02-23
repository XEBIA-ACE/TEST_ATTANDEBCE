'use strict';

const Employee = require('./employee.model');
const { Attendance } = require('./attendance.model');

// ── Associations ──────────────────────────────────────────────────────────────
Employee.hasMany(Attendance, {
  foreignKey: 'employeeId',
  as: 'attendanceRecords',
});

Attendance.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee',
});

module.exports = { Employee, Attendance };
