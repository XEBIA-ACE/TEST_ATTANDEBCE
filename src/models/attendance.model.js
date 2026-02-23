const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database/connection');

class AttendanceRecord extends Model {
  /**
   * Calculate worked hours between clockIn and clockOut minus break time.
   * Returns null when clock-out is not yet recorded.
   */
  calculateTotalHours() {
    if (!this.clockIn || !this.clockOut) return null;
    const diffMs = new Date(this.clockOut) - new Date(this.clockIn);
    const breakMs = (this.breakDurationMinutes || 0) * 60 * 1000;
    return Math.max(0, (diffMs - breakMs) / (1000 * 60 * 60));
  }

  /** Whether the employee has clocked in but not yet clocked out. */
  get isActive() {
    return !!this.clockIn && !this.clockOut;
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
  }
}

AttendanceRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    clockIn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'clock_in',
    },
    clockOut: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'clock_out',
    },
    totalHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'total_hours',
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'overtime_hours',
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
    breakStart: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'break_start',
    },
    breakEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'break_end',
    },
    breakDurationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'break_duration_minutes',
    },
    clockInLocation: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'clock_in_location',
    },
    clockOutLocation: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'clock_out_location',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isManualEntry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_manual_entry',
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approved_by',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
  },
  {
    sequelize,
    modelName: 'AttendanceRecord',
    tableName: 'attendance_records',
    underscored: true,
    paranoid: true,
    timestamps: true,
    hooks: {
      /**
       * Automatically compute totalHours and overtimeHours before save.
       */
      beforeSave: (record) => {
        if (record.clockIn && record.clockOut) {
          const hours = record.calculateTotalHours();
          record.totalHours = parseFloat(hours.toFixed(2));
          // Overtime = hours beyond scheduled (8h default)
          const scheduled = 8;
          record.overtimeHours = parseFloat(Math.max(0, hours - scheduled).toFixed(2));
        }
      },
    },
  },
);

module.exports = AttendanceRecord;
