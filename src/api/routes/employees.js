'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const employeeController = require('../controllers/employeeController');
const validate = require('../middlewares/validate');
// const { authenticate } = require('../middlewares/auth');

const router = Router();

// Validation chains
const uuidParam = param('id').isUUID(4).withMessage('id must be a valid UUID');

const createValidation = [
  body('employee_code')
    .trim()
    .notEmpty().withMessage('employee_code is required')
    .isLength({ max: 20 }).withMessage('employee_code must be at most 20 characters'),
  body('first_name')
    .trim()
    .notEmpty().withMessage('first_name is required')
    .isLength({ max: 100 }),
  body('last_name')
    .trim()
    .notEmpty().withMessage('last_name is required')
    .isLength({ max: 100 }),
  body('email')
    .trim()
    .notEmpty().withMessage('email is required')
    .isEmail().withMessage('email must be a valid email address')
    .normalizeEmail(),
  body('phone').optional().trim().isMobilePhone().withMessage('phone must be a valid phone number'),
  body('department').optional().trim().isLength({ max: 100 }),
  body('position').optional().trim().isLength({ max: 100 }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on_leave'])
    .withMessage('status must be one of: active, inactive, on_leave'),
  body('hire_date').optional().isDate().withMessage('hire_date must be a valid date (YYYY-MM-DD)'),
  body('expected_check_in')
    .optional()
    .matches(/^\d{2}:\d{2}(:\d{2})?$/)
    .withMessage('expected_check_in must be in HH:MM or HH:MM:SS format'),
  body('expected_check_out')
    .optional()
    .matches(/^\d{2}:\d{2}(:\d{2})?$/)
    .withMessage('expected_check_out must be in HH:MM or HH:MM:SS format'),
];

const updateValidation = [
  uuidParam,
  ...createValidation.map((v) =>
    // Make all fields optional on update
    'optional' in v ? v : v.optional()
  ),
];

const listValidation = [
  query('status').optional().isIn(['active', 'inactive', 'on_leave']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

// Routes — uncomment authenticate middleware to enforce JWT auth
router.get('/', /* authenticate, */ listValidation, validate, employeeController.list);
router.get('/departments', /* authenticate, */ employeeController.getDepartments);
router.get('/:id', /* authenticate, */ [uuidParam], validate, employeeController.getById);
router.post('/', /* authenticate, */ createValidation, validate, employeeController.create);
router.put('/:id', /* authenticate, */ updateValidation, validate, employeeController.update);
router.delete('/:id', /* authenticate, */ [uuidParam], validate, employeeController.remove);

module.exports = router;
