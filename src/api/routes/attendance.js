'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const validate = require('../middlewares/validate');
// const { authenticate } = require('../middlewares/auth');

const router = Router();

const uuidParam = param('id').isUUID(4).withMessage('id must be a valid UUID');

const checkInValidation = [
  body('employeeId')
    .notEmpty().withMessage('employeeId is required')
    .isUUID(4).withMessage('employeeId must be a valid UUID'),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim().isLength({ max: 255 }),
];

const checkOutValidation = [
  body('employeeId')
    .notEmpty().withMessage('employeeId is required')
    .isUUID(4).withMessage('employeeId must be a valid UUID'),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim().isLength({ max: 255 }),
];

const updateValidation = [
  uuidParam,
  body('check_in').optional().isISO8601().withMessage('check_in must be a valid ISO 8601 datetime'),
  body('check_out').optional().isISO8601().withMessage('check_out must be a valid ISO 8601 datetime'),
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half_day', 'on_leave'])
    .withMessage('status must be one of: present, absent, late, half_day, on_leave'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

const listValidation = [
  query('employeeId').optional().isUUID(4).withMessage('employeeId must be a valid UUID'),
  query('status').optional().isIn(['present', 'absent', 'late', 'half_day', 'on_leave']),
  query('dateFrom').optional().isDate().withMessage('dateFrom must be YYYY-MM-DD'),
  query('dateTo').optional().isDate().withMessage('dateTo must be YYYY-MM-DD'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const reportValidation = [
  query('employeeId').optional().isUUID(4),
  query('dateFrom').optional().isDate().withMessage('dateFrom must be YYYY-MM-DD'),
  query('dateTo').optional().isDate().withMessage('dateTo must be YYYY-MM-DD'),
];

// Action routes before param routes to avoid conflicts
router.post('/check-in', /* authenticate, */ checkInValidation, validate, attendanceController.checkIn);
router.post('/check-out', /* authenticate, */ checkOutValidation, validate, attendanceController.checkOut);
router.get('/reports/summary', /* authenticate, */ reportValidation, validate, attendanceController.summaryReport);

// Standard CRUD
router.get('/', /* authenticate, */ listValidation, validate, attendanceController.list);
router.get('/:id', /* authenticate, */ [uuidParam], validate, attendanceController.getById);
router.put('/:id', /* authenticate, */ updateValidation, validate, attendanceController.update);
router.delete('/:id', /* authenticate, */ [uuidParam], validate, attendanceController.remove);

module.exports = router;
