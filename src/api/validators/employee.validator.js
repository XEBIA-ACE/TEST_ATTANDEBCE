'use strict';

const Joi = require('joi');

const employeeCodePattern = /^[A-Z0-9\-]{3,20}$/;

const createEmployeeSchema = Joi.object({
  employeeCode: Joi.string().pattern(employeeCodePattern).required().messages({
    'string.pattern.base': 'employeeCode must be 3-20 uppercase alphanumeric characters or hyphens',
  }),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(255).required(),
  department: Joi.string().max(100).optional().allow(null, ''),
  jobTitle: Joi.string().max(100).optional().allow(null, ''),
  expectedHoursPerDay: Joi.number().min(1).max(24).default(8),
  hireDate: Joi.string().isoDate().optional().allow(null, ''),
  password: Joi.string().min(8).max(128).optional(),
  isActive: Joi.boolean().default(true),
});

const updateEmployeeSchema = Joi.object({
  employeeCode: Joi.string().pattern(employeeCodePattern).optional(),
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().max(255).optional(),
  department: Joi.string().max(100).optional().allow(null, ''),
  jobTitle: Joi.string().max(100).optional().allow(null, ''),
  expectedHoursPerDay: Joi.number().min(1).max(24).optional(),
  hireDate: Joi.string().isoDate().optional().allow(null, ''),
  password: Joi.string().min(8).max(128).optional(),
  isActive: Joi.boolean().optional(),
}).min(1); // At least one field must be provided

const listEmployeesSchema = Joi.object({
  department: Joi.string().max(100).optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema, listEmployeesSchema };
