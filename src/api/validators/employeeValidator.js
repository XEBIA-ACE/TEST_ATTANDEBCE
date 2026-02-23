const Joi = require('joi');

const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Sales', 'HR', 'Finance',
  'Operations', 'Legal', 'Product', 'Design', 'Support',
];

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contractor', 'intern'];

const createEmployee = {
  body: Joi.object({
    firstName: Joi.string().trim().min(1).max(100).required(),
    lastName: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().email().lowercase().trim().required(),
    department: Joi.string().valid(...DEPARTMENTS).required(),
    position: Joi.string().trim().min(1).max(150).required(),
    employmentType: Joi.string().valid(...EMPLOYMENT_TYPES).default('full_time'),
    hireDate: Joi.date().iso().max('now').required(),
    managerId: Joi.string().uuid().optional().allow(null),
    phone: Joi.string().trim().pattern(/^\+?[1-9]\d{6,14}$/).optional().allow(null, ''),
  }),
};

const updateEmployee = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    firstName: Joi.string().trim().min(1).max(100),
    lastName: Joi.string().trim().min(1).max(100),
    email: Joi.string().email().lowercase().trim(),
    department: Joi.string().valid(...DEPARTMENTS),
    position: Joi.string().trim().min(1).max(150),
    employmentType: Joi.string().valid(...EMPLOYMENT_TYPES),
    hireDate: Joi.date().iso().max('now'),
    managerId: Joi.string().uuid().optional().allow(null),
    phone: Joi.string().trim().pattern(/^\+?[1-9]\d{6,14}$/).optional().allow(null, ''),
    isActive: Joi.boolean(),
  }).min(1),
};

const getEmployee = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const listEmployees = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    department: Joi.string().valid(...DEPARTMENTS).optional(),
    employmentType: Joi.string().valid(...EMPLOYMENT_TYPES).optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().trim().max(100).optional(),
    sortBy: Joi.string().valid('firstName', 'lastName', 'department', 'hireDate', 'createdAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

module.exports = { createEmployee, updateEmployee, getEmployee, listEmployees };
