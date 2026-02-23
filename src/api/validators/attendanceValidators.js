'use strict';

const Joi = require('joi');

const attendanceStatuses = ['present', 'absent', 'late', 'half_day', 'on_leave'];

const checkInSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  check_in_time: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional().allow('', null),
});

const checkOutSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  check_out_time: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional().allow('', null),
});

const upsertAttendanceSchema = Joi.object({
  check_in_time: Joi.date().iso().optional().allow(null),
  check_out_time: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid(...attendanceStatuses).optional(),
  notes: Joi.string().max(500).optional().allow('', null),
}).min(1);

const listAttendanceSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  employee_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  status: Joi.string().valid(...attendanceStatuses).optional(),
});

const reportQuerySchema = Joi.object({
  employee_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  department: Joi.string().optional(),
});

module.exports = {
  checkInSchema,
  checkOutSchema,
  upsertAttendanceSchema,
  listAttendanceSchema,
  reportQuerySchema,
};
