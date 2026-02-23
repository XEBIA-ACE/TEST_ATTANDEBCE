'use strict';

const { Op } = require('sequelize');
const { Attendance } = require('../models/attendance.model');
const Employee = require('../models/employee.model');

/**
 * AttendanceRepository handles all DB queries for attendance records.
 */
class AttendanceRepository {
  /**
   * Find an attendance record by primary key.
   */
  async findById(id) {
    return Attendance.findByPk(id, {
      include: [{ model: Employee, as: 'employee', attributes: { exclude: ['passwordHash'] } }],
    });
  }

  /**
   * Find the attendance record for a specific employee on a specific date.
   * Enforces the unique-per-employee-per-day constraint at the query level.
   */
  async findByEmployeeAndDate(employeeId, date) {
    return Attendance.findOne({ where: { employeeId, date } });
  }

  /**
   * Paginated attendance records with optional filters.
   * @param {object} filters  - { employeeId, status, startDate, endDate }
   * @param {number} page
   * @param {number} limit
   */
  async findAll({ employeeId, status, startDate, endDate } = {}, page = 1, limit = 20) {
    const where = {};

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;
    return Attendance.findAndCountAll({
      where,
      limit,
      offset,
      order: [['date', 'DESC'], ['checkIn', 'DESC']],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'department'],
        },
      ],
    });
  }

  /**
   * Create a new attendance record.
   */
  async create(data) {
    return Attendance.create(data);
  }

  /**
   * Update an existing attendance record by id.
   */
  async update(id, data) {
    const record = await Attendance.findByPk(id);
    if (!record) return null;
    return record.update(data);
  }

  /**
   * Delete an attendance record by id.
   */
  async delete(id) {
    const record = await Attendance.findByPk(id);
    if (!record) return false;
    await record.destroy();
    return true;
  }

  /**
   * Aggregate summary for a date range and optional employee filter.
   * Returns { totalDays, presentDays, absentDays, lateDays, totalWorkedHours }
   */
  async getSummary(employeeId, startDate, endDate) {
    const { sequelize } = require('../database');
    const { fn, col, literal } = require('sequelize');

    const where = { date: { [Op.between]: [startDate, endDate] } };
    if (employeeId) where.employeeId = employeeId;

    const rows = await Attendance.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('worked_hours')), 'totalHours'],
      ],
      group: ['status'],
      raw: true,
    });

    const summary = {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      onLeaveDays: 0,
      totalWorkedHours: 0,
    };

    for (const row of rows) {
      const count = parseInt(row.count, 10);
      const hours = parseFloat(row.totalHours) || 0;
      summary.totalDays += count;
      summary.totalWorkedHours += hours;

      switch (row.status) {
        case 'present': summary.presentDays += count; break;
        case 'absent':  summary.absentDays += count;  break;
        case 'late':    summary.lateDays += count;    break;
        case 'half_day': summary.halfDays += count;   break;
        case 'on_leave': summary.onLeaveDays += count; break;
      }
    }

    summary.totalWorkedHours = parseFloat(summary.totalWorkedHours.toFixed(2));
    return summary;
  }
}

module.exports = new AttendanceRepository();
