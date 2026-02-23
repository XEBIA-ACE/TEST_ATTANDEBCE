const { v4: uuidv4 } = require('uuid');
const attendanceRepository = require('../../data/repositories/attendanceRepository');
const employeeRepository = require('../../data/repositories/employeeRepository');
const { AppError } = require('../../api/middlewares/errorHandler');
const { startOfDay, endOfDay, calculateWorkedHours, getDateRange, isWeekend } = require('../utils/dateUtils');
const logger = require('../../config/logger');

/**
 * Business logic for attendance tracking.
 */

/**
 * Records an employee check-in.
 * Enforces: employee must exist and be active, no duplicate check-in on the same day.
 *
 * @param {Object} data - { employeeId, notes, location }
 * @returns {Object} New attendance record
 */
const checkIn = async (data) => {
  const employee = await employeeRepository.findById(data.employeeId);
  if (!employee) {
    throw new AppError(`Employee with id '${data.employeeId}' not found`, 404);
  }
  if (!employee.isActive) {
    throw new AppError('Cannot record attendance for an inactive employee', 400);
  }

  // Prevent duplicate check-in on the same calendar day
  const existing = await attendanceRepository.findOpenRecord(
    data.employeeId,
    startOfDay(),
    endOfDay()
  );
  if (existing) {
    throw new AppError('Employee has already checked in today', 400);
  }

  const now = new Date().toISOString();
  const record = await attendanceRepository.create({
    id: uuidv4(),
    employeeId: data.employeeId,
    checkInTime: now,
    checkInNotes: data.notes || null,
    checkInLocation: data.location ? JSON.stringify(data.location) : null,
    status: 'checked_in',
  });

  logger.info('Employee checked in', { employeeId: data.employeeId, recordId: record.id });
  return record;
};

/**
 * Records a check-out for an open attendance record.
 * Calculates total worked hours automatically.
 *
 * @param {string} recordId - Attendance record UUID
 * @param {Object} data - { notes, location }
 * @returns {Object} Updated attendance record
 */
const checkOut = async (recordId, data) => {
  const record = await attendanceRepository.findById(recordId);
  if (!record) {
    throw new AppError(`Attendance record '${recordId}' not found`, 404);
  }
  if (record.status === 'checked_out') {
    throw new AppError('Employee has already checked out for this record', 400);
  }

  const now = new Date().toISOString();
  const workedHours = calculateWorkedHours(record.checkInTime, now);

  const updated = await attendanceRepository.update(recordId, {
    checkOutTime: now,
    checkOutNotes: data.notes || null,
    checkOutLocation: data.location ? JSON.stringify(data.location) : null,
    workedHours,
    status: 'checked_out',
  });

  logger.info('Employee checked out', {
    employeeId: record.employeeId,
    recordId,
    workedHours,
  });

  return updated;
};

/**
 * Returns a paginated list of attendance records with optional filters.
 *
 * @param {Object} filters - Query filters
 * @returns {{ records: Object[], pagination: Object }}
 */
const listAttendance = async (filters) => {
  const { page, pageSize, ...rest } = filters;
  const offset = (page - 1) * pageSize;

  const [records, total] = await Promise.all([
    attendanceRepository.findAll({ ...rest, limit: pageSize, offset }),
    attendanceRepository.count(rest),
  ]);

  return {
    records,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

/**
 * Returns a single attendance record by ID.
 *
 * @param {string} id - UUID
 * @returns {Object}
 */
const getRecordById = async (id) => {
  const record = await attendanceRepository.findById(id);
  if (!record) {
    throw new AppError(`Attendance record '${id}' not found`, 404);
  }
  return record;
};

/**
 * Returns attendance history for a specific employee.
 *
 * @param {string} employeeId
 * @param {Object} query - Pagination and date filters
 * @returns {{ records: Object[], pagination: Object }}
 */
const getEmployeeAttendance = async (employeeId, query) => {
  const employee = await employeeRepository.findById(employeeId);
  if (!employee) {
    throw new AppError(`Employee with id '${employeeId}' not found`, 404);
  }

  return listAttendance({ ...query, employeeId });
};

/**
 * Generates an attendance summary report for a given date range.
 * Computes: total records, average hours, days present per employee.
 *
 * @param {Object} params - { startDate, endDate, department?, employeeId? }
 * @returns {Object} Summary report
 */
const getSummary = async (params) => {
  const { startDate, endDate, department, employeeId } = params;

  const records = await attendanceRepository.findAll({
    startDate,
    endDate,
    department,
    employeeId,
    limit: 10000, // large fetch for aggregation
    offset: 0,
  });

  // Aggregate by employee
  const byEmployee = {};
  for (const record of records) {
    if (!byEmployee[record.employeeId]) {
      byEmployee[record.employeeId] = {
        employeeId: record.employeeId,
        employeeName: `${record.firstName} ${record.lastName}`,
        department: record.department,
        totalDays: 0,
        totalWorkedHours: 0,
        records: [],
      };
    }
    byEmployee[record.employeeId].totalDays += 1;
    byEmployee[record.employeeId].totalWorkedHours += record.workedHours || 0;
    byEmployee[record.employeeId].records.push(record);
  }

  const employeeSummaries = Object.values(byEmployee).map((emp) => ({
    ...emp,
    averageHoursPerDay: emp.totalDays > 0
      ? Math.round((emp.totalWorkedHours / emp.totalDays) * 100) / 100
      : 0,
    records: undefined, // exclude raw records from summary
  }));

  // Total working days in range (excluding weekends)
  const allDays = getDateRange(startDate, endDate);
  const workingDays = allDays.filter((d) => !isWeekend(d)).length;

  return {
    period: { startDate, endDate, totalDays: allDays.length, workingDays },
    totalRecords: records.length,
    employeeCount: employeeSummaries.length,
    employees: employeeSummaries,
  };
};

module.exports = { checkIn, checkOut, listAttendance, getRecordById, getEmployeeAttendance, getSummary };
