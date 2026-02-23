'use strict';

const Joi = require('joi');

const employeeCodePattern = /^[A-Z0-9-]{3,20}$/;

const createEmployeeSchema = Joi.object({
  employee_code: Joi.string().pattern(employeeCodePattern).required()
    .messages({ 'string.pattern.base': 'employee_code must be 3-20 uppercase alphanumeric characters' }),
  first_name: Joi.string().min(1).max(100).trim().required(),
  last_name: Joi.string().min(1).max(100).trim().required(),
  email: Joi.string().email().max(255).required(),
  department: Joi.string().min(1).max(100).trim().optional(),
  position: Joi.string().min(1).max(100).trim().optional(),
  hire_date: Joi.date().iso().max('now').optional(),
});

const updateEmployeeSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).trim().optional(),
  last_name: Joi.string().min(1).max(100).trim().optional(),
  email: Joi.string().email().max(255).optional(),
  department: Joi.string().min(1).max(100).trim().allow(null).optional(),
  position: Joi.string().min(1).max(100).trim().allow(null).optional(),
  hire_date: Joi.date().iso().max('now').allow(null).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);  // At least one field required

const listEmployeesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  department: Joi.string().trim().optional(),
  is_active: Joi.boolean().optional(),
  search: Joi.string().trim().min(1).max(100).optional(),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema, listEmployeesSchema };
