/**
 * Employee model constants and validation schemas.
 * Defines the shape of Employee data and valid status values.
 */
const Joi = require('joi');

const EMPLOYEE_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
});

const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Legal',
  'Product',
  'Design',
  'Customer Support',
];

const createEmployeeSchema = Joi.object({
  employee_code: Joi.string().trim().min(2).max(20).required(),
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().trim().lowercase().max(255).required(),
  phone: Joi.string().trim().max(20).optional().allow('', null),
  department: Joi.string().trim().max(100).optional().allow('', null),
  position: Joi.string().trim().max(100).optional().allow('', null),
  hire_date: Joi.string().isoDate().optional().allow('', null),
  status: Joi.string()
    .valid(...Object.values(EMPLOYEE_STATUS))
    .default(EMPLOYEE_STATUS.ACTIVE),
  manager_id: Joi.string().uuid().optional().allow('', null),
});

const updateEmployeeSchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).optional(),
  last_name: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().email().trim().lowercase().max(255).optional(),
  phone: Joi.string().trim().max(20).optional().allow('', null),
  department: Joi.string().trim().max(100).optional().allow('', null),
  position: Joi.string().trim().max(100).optional().allow('', null),
  hire_date: Joi.string().isoDate().optional().allow('', null),
  status: Joi.string()
    .valid(...Object.values(EMPLOYEE_STATUS))
    .optional(),
  manager_id: Joi.string().uuid().optional().allow('', null),
}).min(1);

module.exports = {
  EMPLOYEE_STATUS,
  DEPARTMENTS,
  createEmployeeSchema,
  updateEmployeeSchema,
};
