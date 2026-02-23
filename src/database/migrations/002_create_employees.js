/** @type {import('umzug').MigrationFn} */
async function up({ context: queryInterface }) {
  const { DataTypes } = require('sequelize');

  await queryInterface.createTable('employees', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    employee_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Human-readable employee ID, e.g. EMP-0001',
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    employment_type: {
      type: DataTypes.ENUM('full_time', 'part_time', 'contractor', 'intern'),
      allowNull: false,
      defaultValue: 'full_time',
    },
    hire_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    termination_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Work schedule defaults (hours per day, work days)
    scheduled_hours_per_day: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 8.0,
      comment: 'Expected work hours per day',
    },
    work_days: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [1, 2, 3, 4, 5],
      comment: 'ISO day-of-week numbers: 1=Monday … 7=Sunday',
    },
    // Timezone for correct clock-in/out local-time calculations
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'UTC',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addIndex('employees', ['email'], { unique: true });
  await queryInterface.addIndex('employees', ['employee_number'], { unique: true });
  await queryInterface.addIndex('employees', ['department_id']);
  await queryInterface.addIndex('employees', ['is_active']);

  // Now add the manager FK to departments
  await queryInterface.addConstraint('departments', {
    fields: ['manager_id'],
    type: 'foreign key',
    name: 'fk_departments_manager',
    references: { table: 'employees', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

/** @type {import('umzug').MigrationFn} */
async function down({ context: queryInterface }) {
  await queryInterface.removeConstraint('departments', 'fk_departments_manager');
  await queryInterface.dropTable('employees');
}

module.exports = { up, down };
