'use strict';

const { Router } = require('express');
const employeeRoutes = require('./employees');
const attendanceRoutes = require('./attendance');

const router = Router();

router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);

module.exports = router;
