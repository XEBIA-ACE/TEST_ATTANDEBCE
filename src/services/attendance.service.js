const attendanceRepository = require('../repositories/attendance.repository');
const employeeRepository = require('../repositories/employee.repository');
const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require('../utils/errors');

/**
 * Business logic layer for Attendance operations.
 */
class AttendanceService {
  /**
   * List attendance records with optional filters.
   */
  async listRecords(filters) {
    const { count, rows } = await attendanceRepository.findAll({
      ...filters,
      includeEmployee: true,
    });
    return { count, records: rows.map((r) => r.toJSON()) };
  }

  /**
   * Get a single attendance record.
   */
  async getRecord(id) {
    const record = await attendanceRepository.findById(id);
    if (!record) throw new NotFoundError('Attendance record');
    return record.toJSON();
  }

  /**
   * Clock-in an employee for today (or the supplied date).
   *
   * Rules enforced:
   *  - Employee must exist and be active.
   *  - The employee must not already have an open (un-clocked-out) session.
   *  - Only one record per employee per calendar date.
   */
  async clockIn(employeeId, { date, location, notes } = {}) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee');
    if (!employee.isActive) throw new BadRequestError('Employee is not active');

    const recordDate = date || new Date().toISOString().split('T')[0];

    // Guard: no duplicate for same date
    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, recordDate);
    if (existing) {
      throw new ConflictError(
        `Attendance record already exists for employee ${employeeId} on ${recordDate}`,
      );
    }

    // Guard: no open clock-in session
    const openSession = await attendanceRepository.findActiveClockIn(employeeId);
    if (openSession) {
      throw new ConflictError(
        `Employee ${employeeId} already has an open clock-in session (record ${openSession.id})`,
      );
    }

    const clockInTime = new Date();
    const record = await attendanceRepository.create({
      employeeId,
      date: recordDate,
      clockIn: clockInTime,
      status: 'present',
      clockInLocation: location || null,
      notes: notes || null,
    });

    return record.toJSON();
  }

  /**
   * Clock-out an employee.
   *
   * Rules enforced:
   *  - The attendance record must exist and have a clock-in but no clock-out.
   *  - Clock-out time must be after clock-in time.
   */
  async clockOut(employeeId, { location, notes } = {}) {
    const openSession = await attendanceRepository.findActiveClockIn(employeeId);
    if (!openSession) {
      throw new BadRequestError(`No open clock-in session found for employee ${employeeId}`);
    }

    const clockOutTime = new Date();
    if (clockOutTime <= new Date(openSession.clockIn)) {
      throw new BadRequestError('Clock-out time must be after clock-in time');
    }

    const updateData = {
      clockOut: clockOutTime,
      clockOutLocation: location || null,
    };
    if (notes) updateData.notes = notes;

    const updated = await attendanceRepository.update(openSession.id, updateData);
    return updated.toJSON();
  }

  /**
   * Start a break for an active clock-in session.
   */
  async startBreak(employeeId) {
    const openSession = await attendanceRepository.findActiveClockIn(employeeId);
    if (!openSession) {
      throw new BadRequestError(`No open clock-in session found for employee ${employeeId}`);
    }
    if (openSession.breakStart && !openSession.breakEnd) {
      throw new ConflictError('A break is already in progress');
    }

    const updated = await attendanceRepository.update(openSession.id, {
      breakStart: new Date(),
      breakEnd: null,
    });
    return updated.toJSON();
  }

  /**
   * End a break and accumulate break duration.
   */
  async endBreak(employeeId) {
    const openSession = await attendanceRepository.findActiveClockIn(employeeId);
    if (!openSession) {
      throw new BadRequestError(`No open clock-in session found for employee ${employeeId}`);
    }
    if (!openSession.breakStart || openSession.breakEnd) {
      throw new BadRequestError('No break in progress');
    }

    const breakEnd = new Date();
    const breakMs = breakEnd - new Date(openSession.breakStart);
    const additionalMinutes = Math.round(breakMs / 60000);
    const totalBreakMinutes = (openSession.breakDurationMinutes || 0) + additionalMinutes;

    const updated = await attendanceRepository.update(openSession.id, {
      breakEnd,
      breakDurationMinutes: totalBreakMinutes,
    });
    return updated.toJSON();
  }

  /**
   * Create a manual attendance record (admin use, e.g. correcting records).
   */
  async createManualRecord(data, adminEmployeeId) {
    const employee = await employeeRepository.findById(data.employeeId);
    if (!employee) throw new NotFoundError('Employee');

    const existing = await attendanceRepository.findByEmployeeAndDate(
      data.employeeId,
      data.date,
    );
    if (existing) {
      throw new ConflictError(
        `Attendance record already exists for employee ${data.employeeId} on ${data.date}`,
      );
    }

    if (data.clockIn && data.clockOut) {
      const ci = new Date(data.clockIn);
      const co = new Date(data.clockOut);
      if (co <= ci) throw new BadRequestError('clockOut must be after clockIn');
    }

    const record = await attendanceRepository.create({
      ...data,
      isManualEntry: true,
      approvedBy: adminEmployeeId || null,
      approvedAt: adminEmployeeId ? new Date() : null,
    });
    return record.toJSON();
  }

  /**
   * Update an existing record (admin correction).
   */
  async updateRecord(id, data) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) throw new NotFoundError('Attendance record');

    if (data.clockIn && data.clockOut) {
      const ci = new Date(data.clockIn);
      const co = new Date(data.clockOut);
      if (co <= ci) throw new BadRequestError('clockOut must be after clockIn');
    }

    const updated = await attendanceRepository.update(id, data);
    return updated.toJSON();
  }

  /**
   * Soft-delete a record.
   */
  async deleteRecord(id) {
    const deleted = await attendanceRepository.delete(id);
    if (!deleted) throw new NotFoundError('Attendance record');
  }

  /**
   * Aggregate attendance statistics for reporting.
   */
  async getSummary({ employeeId, startDate, endDate }) {
    if (employeeId) {
      const employee = await employeeRepository.findById(employeeId);
      if (!employee) throw new NotFoundError('Employee');
    }
    return attendanceRepository.getSummary({ employeeId, startDate, endDate });
  }
}

module.exports = new AttendanceService();
