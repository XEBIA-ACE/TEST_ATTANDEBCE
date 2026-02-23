const Joi = require('joi');

const checkIn = {
  body: Joi.object({
    employeeId: Joi.string().uuid().required(),
    notes: Joi.string().trim().max(500).optional().allow(null, ''),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().trim().max(255).optional(),
    }).optional().allow(null),
  }),
};

const checkOut = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    notes: Joi.string().trim().max(500).optional().allow(null, ''),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().trim().max(255).optional(),
    }).optional().allow(null),
  }),
};

const getRecord = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const listAttendance = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    employeeId: Joi.string().uuid().optional(),
    department: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    status: Joi.string().valid('checked_in', 'checked_out', 'absent').optional(),
    sortBy: Joi.string().valid('checkInTime', 'checkOutTime', 'createdAt').default('checkInTime'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

const getSummary = {
  query: Joi.object({
    employeeId: Joi.string().uuid().optional(),
    department: Joi.string().optional(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  }),
};

const employeeAttendance = {
  params: Joi.object({
    employeeId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

module.exports = { checkIn, checkOut, getRecord, listAttendance, getSummary, employeeAttendance };
