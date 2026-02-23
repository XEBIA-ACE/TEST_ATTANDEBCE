const { Router } = require('express');
const controller = require('../controllers/attendanceController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const v = require('../validators/attendanceValidator');

const router = Router();

router.use(authenticate);

// Summary / reporting endpoint — managers and above
router.get('/summary', authorize('admin', 'hr', 'manager'), validate(v.getSummary), controller.getSummary);

// Employee-scoped attendance history
router.get('/employees/:employeeId', validate(v.employeeAttendance), controller.getEmployeeAttendance);

// Core check-in / check-out operations
router.post('/check-in', validate(v.checkIn), controller.checkIn);
router.patch('/:id/check-out', validate(v.checkOut), controller.checkOut);

// Generic list and detail
router.get('/', validate(v.listAttendance), controller.listAttendance);
router.get('/:id', validate(v.getRecord), controller.getRecord);

module.exports = router;
