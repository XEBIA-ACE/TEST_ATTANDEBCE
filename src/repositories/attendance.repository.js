const { Op } = require('sequelize');
const { AttendanceRecord, Employee } = require('../models');

class AttendanceRepository {
  /**
   * Find all attendance records with optional filters and pagination.
   */
  async findAll({
    page = 1,
    limit = 20,
    employeeId,
    startDate,
    endDate,
    status,
    includeEmployee = false,
  } = {}) {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const include = [];
    if (includeEmployee) {
      include.push({
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeNumber', 'firstName', 'lastName', 'email'],
      });
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await AttendanceRecord.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['date', 'DESC'], ['clockIn', 'DESC']],
    });

    return { count, rows };
  }

  /**
   * Find a single record by its UUID.
   */
  async findById(id) {
    return AttendanceRecord.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeNumber', 'firstName', 'lastName'],
        },
      ],
    });
  }

  /**
   * Find a record for a given employee on a specific date (DATEONLY string).
   */
  async findByEmployeeAndDate(employeeId, date) {
    return AttendanceRecord.findOne({ where: { employeeId, date } });
  }

  /**
   * Find the currently active (clocked-in, not clocked-out) record for an employee.
   */
  async findActiveClockIn(employeeId) {
    return AttendanceRecord.findOne({
      where: {
        employeeId,
        clockIn: { [Op.ne]: null },
        clockOut: null,
      },
      order: [['clockIn', 'DESC']],
    });
  }

  /**
   * Create a new attendance record.
   */
  async create(data) {
    return AttendanceRecord.create(data);
  }

  /**
   * Update an existing record by PK.
   */
  async update(id, data) {
    const [affectedCount, [updated]] = await AttendanceRecord.update(data, {
      where: { id },
      returning: true,
    });
    if (affectedCount === 0) return null;
    return updated;
  }

  /**
   * Soft-delete a record.
   */
  async delete(id) {
    const record = await AttendanceRecord.findByPk(id);
    if (!record) return false;
    await record.destroy();
    return true;
  }

  /**
   * Aggregate daily attendance stats for a date range.
   * Used for summary/report endpoints.
   */
  async getSummary({ employeeId, startDate, endDate }) {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const records = await AttendanceRecord.findAll({ where });

    const summary = records.reduce(
      (acc, r) => {
        acc.totalDays += 1;
        acc.totalHours += parseFloat(r.totalHours || 0);
        acc.overtimeHours += parseFloat(r.overtimeHours || 0);
        acc.statusCounts[r.status] = (acc.statusCounts[r.status] || 0) + 1;
        return acc;
      },
      { totalDays: 0, totalHours: 0, overtimeHours: 0, statusCounts: {} },
    );

    summary.totalHours = parseFloat(summary.totalHours.toFixed(2));
    summary.overtimeHours = parseFloat(summary.overtimeHours.toFixed(2));
    return summary;
  }
}

module.exports = new AttendanceRepository();
