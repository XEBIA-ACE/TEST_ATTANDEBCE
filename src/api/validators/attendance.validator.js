const Joi = require('joi');

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'remote'];

const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  address: Joi.string().max(255).allow(null, ''),
});

const clockInSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  date: Joi.string().isoDate().optional(),
  location: locationSchema.optional(),
  notes: Joi.string().max(1000).allow(null, '').optional(),
});

const clockOutSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  location: locationSchema.optional(),
  notes: Joi.string().max(1000).allow(null, '').optional(),
});

const breakSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
});

const manualRecordSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  date: Joi.string().isoDate().required(),
  clockIn: Joi.string().isoDate().allow(null).optional(),
  clockOut: Joi.string().isoDate().allow(null).optional(),
  status: Joi.string().valid(...ATTENDANCE_STATUSES).default('present'),
  breakDurationMinutes: Joi.number().integer().min(0).default(0),
  notes: Joi.string().max(1000).allow(null, '').optional(),
  clockInLocation: locationSchema.optional(),
  clockOutLocation: locationSchema.optional(),
});

const updateRecordSchema = Joi.object({
  clockIn: Joi.string().isoDate().allow(null),
  clockOut: Joi.string().isoDate().allow(null),
  status: Joi.string().valid(...ATTENDANCE_STATUSES),
  breakDurationMinutes: Joi.number().integer().min(0),
  notes: Joi.string().max(1000).allow(null, ''),
  clockInLocation: locationSchema,
  clockOutLocation: locationSchema,
}).min(1);

const listRecordsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  employeeId: Joi.string().uuid().optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  status: Joi.string().valid(...ATTENDANCE_STATUSES).optional(),
});

const summarySchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
});

module.exports = {
  clockInSchema,
  clockOutSchema,
  breakSchema,
  manualRecordSchema,
  updateRecordSchema,
  listRecordsSchema,
  summarySchema,
};
