const Joi = require('joi');

const checkIn = {
  params: Joi.object({ employeeId: Joi.string().uuid().required() }),
  body: Joi.object({
    notes: Joi.string().trim().max(500).allow('', null).optional(),
  }),
};

const checkOut = {
  params: Joi.object({ employeeId: Joi.string().uuid().required() }),
  body: Joi.object({
    notes: Joi.string().trim().max(500).allow('', null).optional(),
  }),
};

const createRecord = {
  body: Joi.object({
    employee_id: Joi.string().uuid().required(),
    date: Joi.date().iso().required(),
    check_in: Joi.date().iso().required(),
    check_out: Joi.date().iso().greater(Joi.ref('check_in')).allow(null).optional(),
    status: Joi.string()
      .valid('present', 'absent', 'late', 'half_day', 'on_leave')
      .default('present'),
    notes: Joi.string().trim().max(500).allow('', null).optional(),
  }),
};

const updateRecord = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    check_in: Joi.date().iso(),
    check_out: Joi.date().iso().allow(null),
    status: Joi.string().valid('present', 'absent', 'late', 'half_day', 'on_leave'),
    notes: Joi.string().trim().max(500).allow('', null),
  }).min(1),
};

const listRecords = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    employee_id: Joi.string().uuid().optional(),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
    status: Joi.string().valid('present', 'absent', 'late', 'half_day', 'on_leave').optional(),
  }),
};

const getRecord = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

module.exports = { checkIn, checkOut, createRecord, updateRecord, listRecords, getRecord };
