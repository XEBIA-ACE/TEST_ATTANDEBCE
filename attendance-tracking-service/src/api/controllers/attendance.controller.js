const AttendanceService = require('../../services/attendance.service');
const { ValidationError } = require('../../utils/errors');

const service = new AttendanceService();

/**
 * Attendance controller — delegates to AttendanceService and
 * formats HTTP responses consistently.
 */

async function listRecords(req, res, next) {
  try {
    const result = await service.listRecords(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getRecord(req, res, next) {
  try {
    const record = await service.getRecord(req.params.id);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

async function checkIn(req, res, next) {
  try {
    const { employee_id, notes, location } = req.body;
    if (!employee_id) throw new ValidationError('employee_id is required');

    const record = await service.checkIn(employee_id, { notes, location });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

async function checkOut(req, res, next) {
  try {
    const { employee_id, notes, location } = req.body;
    if (!employee_id) throw new ValidationError('employee_id is required');

    const record = await service.checkOut(employee_id, { notes, location });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

async function createRecord(req, res, next) {
  try {
    const record = await service.createRecord(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

async function updateRecord(req, res, next) {
  try {
    const record = await service.updateRecord(req.params.id, req.body);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

async function deleteRecord(req, res, next) {
  try {
    const result = await service.deleteRecord(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const { employee_id } = req.params;
    const { date_from, date_to } = req.query;

    if (!date_from || !date_to) {
      throw new ValidationError('date_from and date_to query params are required');
    }

    const summary = await service.getSummary(employee_id, date_from, date_to);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRecords,
  getRecord,
  checkIn,
  checkOut,
  createRecord,
  updateRecord,
  deleteRecord,
  getSummary,
};
