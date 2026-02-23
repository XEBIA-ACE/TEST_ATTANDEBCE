'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database');

class Employee extends Model {}

Employee.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'employee_code',
      comment: 'Unique short identifier, e.g. EMP-001',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'job_title',
    },
    // Work schedule config (daily expected hours)
    expectedHoursPerDay: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 8.0,
      field: 'expected_hours_per_day',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'hire_date',
    },
    // Password hash is stored here; authentication is a placeholder
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash',
    },
  },
  {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    underscored: false,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,      // soft deletes via deleted_at
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['employee_code'] },
      { fields: ['email'] },
      { fields: ['department'] },
      { fields: ['is_active'] },
    ],
  }
);

module.exports = Employee;
