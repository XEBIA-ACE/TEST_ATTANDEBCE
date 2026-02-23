'use strict';

const Joi = require('joi');

const employeeStatuses = ['active', 'inactive', 'on_leave'];

const createEmployeeSchema = Joi.object({
  employee_code: Joi.string().max(20).required(),
  first_name: Joi.string().max(100).required(),
  last_name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(20).optional(),
  department: Joi.string().max(100).optional(),
  position: Joi.string().max(100).optional(),
  manager_id: Joi.string().uuid().optional().allow(null),
  status: Joi.string().valid(...employeeStatuses).default('active'),
  hire_date: Joi.date().iso().optional().allow(null),
  password: Joi.string().min(8).optional(),
});

const updateEmployeeSchema = Joi.object({
  employee_code: Joi.string().max(20).optional(),
  first_name: Joi.string().max(100).optional(),
  last_name: Joi.string().max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(20).optional().allow(null),
  department: Joi.string().max(100).optional().allow(null),
  position: Joi.string().max(100).optional().allow(null),
  manager_id: Joi.string().uuid().optional().allow(null),
  status: Joi.string().valid(...employeeStatuses).optional(),
  hire_date: Joi.date().iso().optional().allow(null),
  password: Joi.string().min(8).optional(),
}).min(1);

const listEmployeesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  department: Joi.string().optional(),
  status: Joi.string().valid(...employeeStatuses).optional(),
  search: Joi.string().max(100).optional(),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema, listEmployeesSchema };
