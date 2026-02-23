'use strict';

const { Router } = require('express');
const Joi = require('joi');
const EmployeeController = require('../controllers/employeeController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

const router = Router();
const controller = new EmployeeController();

// --- Validation Schemas ---

const createEmployeeSchema = Joi.object({
  employee_number: Joi.string().trim().max(50).required(),
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  department: Joi.string().trim().max(100).required(),
  position: Joi.string().trim().max(100).required(),
  status: Joi.string().valid('active', 'inactive', 'on_leave').default('active'),
  hire_date: Joi.date().iso().required(),
});

const updateEmployeeSchema = Joi.object({
  employee_number: Joi.string().trim().max(50),
  first_name: Joi.string().trim().min(1).max(100),
  last_name: Joi.string().trim().min(1).max(100),
  email: Joi.string().email().lowercase(),
  department: Joi.string().trim().max(100),
  position: Joi.string().trim().max(100),
  status: Joi.string().valid('active', 'inactive', 'on_leave'),
  hire_date: Joi.date().iso(),
}).min(1); // At least one field required for update

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('active', 'inactive', 'on_leave'),
  department: Joi.string().trim(),
  search: Joi.string().trim().max(200),
});

// --- Routes ---

// GET /api/v1/employees/departments  (must come before /:id)
router.get('/departments', authenticate, controller.getDepartments);

// GET /api/v1/employees
router.get('/', authenticate, validate(listQuerySchema, 'query'), controller.list);

// GET /api/v1/employees/:id
router.get('/:id', authenticate, controller.getById);

// POST /api/v1/employees
router.post('/', authenticate, validate(createEmployeeSchema), controller.create);

// PATCH /api/v1/employees/:id
router.patch('/:id', authenticate, validate(updateEmployeeSchema), controller.update);

// DELETE /api/v1/employees/:id
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
