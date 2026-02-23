const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database/connection');

class Employee extends Model {
  /** Computed full name */
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
  }
}

Employee.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    employeeNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'employee_number',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'department_id',
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    employmentType: {
      type: DataTypes.ENUM('full_time', 'part_time', 'contractor', 'intern'),
      allowNull: false,
      defaultValue: 'full_time',
      field: 'employment_type',
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'hire_date',
      validate: {
        isDate: true,
      },
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'termination_date',
    },
    scheduledHoursPerDay: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 8.0,
      field: 'scheduled_hours_per_day',
      validate: {
        min: 0,
        max: 24,
      },
    },
    workDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [1, 2, 3, 4, 5],
      field: 'work_days',
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'UTC',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    underscored: true,
    paranoid: true,
    timestamps: true,
    hooks: {
      /**
       * Auto-generate sequential employee number before creation.
       * Uses a simple prefix+count strategy — swap for a DB sequence in production.
       */
      beforeCreate: async (employee) => {
        if (!employee.employeeNumber) {
          const count = await Employee.count({ paranoid: false });
          employee.employeeNumber = `EMP-${String(count + 1).padStart(4, '0')}`;
        }
      },
    },
  },
);

module.exports = Employee;
