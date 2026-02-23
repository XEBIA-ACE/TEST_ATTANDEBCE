const Joi = require('joi');

const createEmployee = {
  body: Joi.object({
    first_name: Joi.string().trim().min(1).max(100).required(),
    last_name: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().email().lowercase().required(),
    employee_code: Joi.string().trim().max(20).optional(),
    department: Joi.string().trim().max(100).optional(),
    position: Joi.string().trim().max(100).optional(),
    hire_date: Joi.date().iso().optional(),
    status: Joi.string().valid('active', 'inactive', 'on_leave').default('active'),
  }),
};

const updateEmployee = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    first_name: Joi.string().trim().min(1).max(100),
    last_name: Joi.string().trim().min(1).max(100),
    email: Joi.string().email().lowercase(),
    department: Joi.string().trim().max(100).allow(null),
    position: Joi.string().trim().max(100).allow(null),
    hire_date: Joi.date().iso().allow(null),
    status: Joi.string().valid('active', 'inactive', 'on_leave'),
  }).min(1),
};

const getEmployee = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

const listEmployees = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    department: Joi.string().trim().optional(),
    status: Joi.string().valid('active', 'inactive', 'on_leave').optional(),
    search: Joi.string().trim().max(100).optional(),
  }),
};

module.exports = { createEmployee, updateEmployee, getEmployee, listEmployees };
