/** @type {import('umzug').MigrationFn} */
async function up({ context: queryInterface }) {
  const { DataTypes } = require('sequelize');

  await queryInterface.createTable('attendance_records', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Calendar date this record belongs to (employee local time)',
    },
    clock_in: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'UTC timestamp of clock-in event',
    },
    clock_out: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'UTC timestamp of clock-out event',
    },
    // Calculated on clock-out / manual update
    total_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Total worked hours for this record',
    },
    overtime_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(
        'present',
        'absent',
        'late',
        'half_day',
        'on_leave',
        'holiday',
        'remote',
      ),
      allowNull: false,
      defaultValue: 'present',
    },
    // Break tracking (optional)
    break_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    break_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    break_duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    // Location / device info
    clock_in_location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '{ lat, lng, address } at clock-in',
    },
    clock_out_location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '{ lat, lng, address } at clock-out',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Audit
    is_manual_entry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True if record was created/edited by an admin',
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'employees', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
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

  // One record per employee per day (non-deleted)
  await queryInterface.addIndex('attendance_records', ['employee_id', 'date'], {
    unique: true,
    where: { deleted_at: null },
    name: 'uq_attendance_employee_date',
  });
  await queryInterface.addIndex('attendance_records', ['employee_id']);
  await queryInterface.addIndex('attendance_records', ['date']);
  await queryInterface.addIndex('attendance_records', ['status']);
  await queryInterface.addIndex('attendance_records', ['clock_in']);
}

/** @type {import('umzug').MigrationFn} */
async function down({ context: queryInterface }) {
  await queryInterface.dropTable('attendance_records');
}

module.exports = { up, down };
