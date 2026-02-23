'use strict';

const { Router } = require('express');
const Joi = require('joi');
const AttendanceController = require('../controllers/attendanceController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

const router = Router();
const controller = new AttendanceController();

// --- Validation Schemas ---

const checkInSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  check_in: Joi.date().iso(),
  notes: Joi.string().max(500).allow('', null),
});

const checkOutSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  check_out: Joi.date().iso(),
  notes: Joi.string().max(500).allow('', null),
});

const upsertSchema = Joi.object({
  check_in: Joi.date().iso(),
  check_out: Joi.date().iso().when('check_in', {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref('check_in')),
  }),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day', 'on_leave'),
  notes: Joi.string().max(500).allow('', null),
});

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  employee_id: Joi.string().uuid(),
  date_from: Joi.date().iso(),
  date_to: Joi.date().iso().min(Joi.ref('date_from')),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day', 'on_leave'),
});

const summaryQuerySchema = Joi.object({
  date_from: Joi.date().iso().required(),
  date_to: Joi.date().iso().min(Joi.ref('date_from')).required(),
});

const departmentReportSchema = Joi.object({
  date: Joi.date().iso().required(),
});

// --- Routes ---

// Reports (must come before /:id to avoid param conflicts)
router.get(
  '/reports/employee/:employeeId',
  authenticate,
  validate(summaryQuerySchema, 'query'),
  controller.getEmployeeSummary
);

router.get(
  '/reports/department',
  authenticate,
  validate(departmentReportSchema, 'query'),
  controller.getDepartmentReport
);

// Check-in / Check-out
router.post('/check-in', authenticate, validate(checkInSchema), controller.checkIn);
router.post('/check-out', authenticate, validate(checkOutSchema), controller.checkOut);

// CRUD
router.get('/', authenticate, validate(listQuerySchema, 'query'), controller.list);
router.get('/:id', authenticate, controller.getById);
router.put('/:employeeId/:date', authenticate, validate(upsertSchema), controller.upsert);
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
