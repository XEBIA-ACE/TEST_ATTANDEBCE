const Joi = require('joi');

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contractor', 'intern'];

const createEmployeeSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(255).required(),
  phone: Joi.string().max(20).allow(null, '').optional(),
  departmentId: Joi.string().uuid().allow(null).optional(),
  position: Joi.string().max(100).allow(null, '').optional(),
  employmentType: Joi.string()
    .valid(...EMPLOYMENT_TYPES)
    .default('full_time'),
  hireDate: Joi.string().isoDate().required(),
  scheduledHoursPerDay: Joi.number().min(0).max(24).default(8.0),
  workDays: Joi.array()
    .items(Joi.number().integer().min(1).max(7))
    .min(1)
    .max(7)
    .default([1, 2, 3, 4, 5]),
  timezone: Joi.string().max(50).default('UTC'),
  isActive: Joi.boolean().default(true),
});

const updateEmployeeSchema = Joi.object({
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  email: Joi.string().email().max(255),
  phone: Joi.string().max(20).allow(null, ''),
  departmentId: Joi.string().uuid().allow(null),
  position: Joi.string().max(100).allow(null, ''),
  employmentType: Joi.string().valid(...EMPLOYMENT_TYPES),
  hireDate: Joi.string().isoDate(),
  terminationDate: Joi.string().isoDate().allow(null),
  scheduledHoursPerDay: Joi.number().min(0).max(24),
  workDays: Joi.array().items(Joi.number().integer().min(1).max(7)).min(1).max(7),
  timezone: Joi.string().max(50),
  isActive: Joi.boolean(),
}).min(1);

const listEmployeesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).allow('').optional(),
  departmentId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  employmentType: Joi.string().valid(...EMPLOYMENT_TYPES).optional(),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema, listEmployeesSchema };
