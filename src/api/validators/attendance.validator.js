'use strict';

const Joi = require('joi');

const STATUSES = ['present', 'absent', 'late', 'half_day', 'on_leave'];

const checkInSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
});

const checkOutSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
});

const createAttendanceSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  date: Joi.string().isoDate().required(),
  checkIn: Joi.date().iso().optional().allow(null),
  checkOut: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid(...STATUSES).default('present'),
  notes: Joi.string().max(1000).optional().allow(null, ''),
});

const updateAttendanceSchema = Joi.object({
  checkIn: Joi.date().iso().optional().allow(null),
  checkOut: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid(...STATUSES).optional(),
  notes: Joi.string().max(1000).optional().allow(null, ''),
}).min(1);

const listAttendanceSchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const reportSchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
});

module.exports = {
  checkInSchema,
  checkOutSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceSchema,
  reportSchema,
};
