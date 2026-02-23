const express = require('express');
const router = express.Router();

const employeeRoutes = require('./employees');
const attendanceRoutes = require('./attendance');
const reportRoutes = require('./reports');

router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
