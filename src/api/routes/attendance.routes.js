const { Router } = require('express');
const controller = require('../controllers/attendance.controller');
const validate = require('../middlewares/validate.middleware');
const {
  clockInSchema,
  clockOutSchema,
  breakSchema,
  manualRecordSchema,
  updateRecordSchema,
  listRecordsSchema,
  summarySchema,
} = require('../validators/attendance.validator');

const router = Router();

// Reporting (must be before /:id to avoid conflicts)
// GET /api/v1/attendance/summary
router.get('/summary', validate(summarySchema, 'query'), controller.summary);

// Clock actions
// POST /api/v1/attendance/clock-in
router.post('/clock-in', validate(clockInSchema), controller.clockIn);

// POST /api/v1/attendance/clock-out
router.post('/clock-out', validate(clockOutSchema), controller.clockOut);

// Break management
// POST /api/v1/attendance/break/start
router.post('/break/start', validate(breakSchema), controller.startBreak);

// POST /api/v1/attendance/break/end
router.post('/break/end', validate(breakSchema), controller.endBreak);

// Manual admin entry
// POST /api/v1/attendance/manual
router.post('/manual', validate(manualRecordSchema), controller.createManual);

// CRUD
// GET  /api/v1/attendance
router.get('/', validate(listRecordsSchema, 'query'), controller.list);

// GET  /api/v1/attendance/:id
router.get('/:id', controller.get);

// PATCH /api/v1/attendance/:id
router.patch('/:id', validate(updateRecordSchema), controller.update);

// DELETE /api/v1/attendance/:id
router.delete('/:id', controller.delete);

module.exports = router;
