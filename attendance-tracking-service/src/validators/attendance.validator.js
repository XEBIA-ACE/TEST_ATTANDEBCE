'use strict';

const Joi = require('joi');

const VALID_STATUSES = ['present', 'absent', 'late', 'half_day', 'holiday', 'leave'];

const checkInSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  check_in_time: Joi.date().iso().max('now').optional(),  // defaults to NOW() if omitted
  notes: Joi.string().max(500).trim().allow(null, '').optional(),
});

const checkOutSchema = Joi.object({
  check_out_time: Joi.date().iso().max('now').optional(),  // defaults to NOW() if omitted
  notes: Joi.string().max(500).trim().allow(null, '').optional(),
});

const createAttendanceSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  check_in_time: Joi.date().iso().allow(null).optional(),
  check_out_time: Joi.date().iso().allow(null).optional(),
  status: Joi.string().valid(...VALID_STATUSES).required(),
  notes: Joi.string().max(500).trim().allow(null, '').optional(),
});

const updateAttendanceSchema = Joi.object({
  check_in_time: Joi.date().iso().allow(null).optional(),
  check_out_time: Joi.date().iso().allow(null).optional(),
  status: Joi.string().valid(...VALID_STATUSES).optional(),
  notes: Joi.string().max(500).trim().allow(null, '').optional(),
}).min(1);

const listAttendanceSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  employee_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().when('start_date', {
    is: Joi.exist(),
    then: Joi.date().iso().min(Joi.ref('start_date')).optional(),
  }),
  status: Joi.string().valid(...VALID_STATUSES).optional(),
  department: Joi.string().trim().optional(),
});

const reportQuerySchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  employee_id: Joi.string().uuid().optional(),
  department: Joi.string().trim().optional(),
});

module.exports = {
  checkInSchema,
  checkOutSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceSchema,
  reportQuerySchema,
};
