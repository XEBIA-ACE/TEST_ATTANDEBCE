const { sequelize } = require('../database/connection');
const Department = require('./department.model');
const Employee = require('./employee.model');
const AttendanceRecord = require('./attendance.model');

// ── Associations ──────────────────────────────────────────────────────────────

// Department ↔ Employee (a department has many employees)
Department.hasMany(Employee, { foreignKey: 'department_id', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Department ↔ Manager (one employee manages a department)
Department.belongsTo(Employee, { foreignKey: 'manager_id', as: 'manager' });
Employee.hasMany(Department, { foreignKey: 'manager_id', as: 'managedDepartments' });

// Employee ↔ AttendanceRecord
Employee.hasMany(AttendanceRecord, { foreignKey: 'employee_id', as: 'attendanceRecords' });
AttendanceRecord.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// Approver relationship
Employee.hasMany(AttendanceRecord, { foreignKey: 'approved_by', as: 'approvedRecords' });
AttendanceRecord.belongsTo(Employee, { foreignKey: 'approved_by', as: 'approver' });

module.exports = {
  sequelize,
  Department,
  Employee,
  AttendanceRecord,
};
